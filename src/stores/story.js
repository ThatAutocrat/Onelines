import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'
import { getBotSentence, BOT_ID, BOT_USERNAME } from '@/lib/bot'

const TURN_SECONDS = 300
const GROQ_KEY     = import.meta.env.VITE_GROQ_API_KEY

export const useStoryStore = defineStore('story', () => {
  const currentStory    = ref(null)
  const sentences       = ref([])
  const inQueue         = ref(false)
  const isBotGame       = ref(false)
  const botThinking     = ref(false)
  const savedStories    = ref([])
  const partnerTyping   = ref(false)
  const turnSecondsLeft = ref(TURN_SECONDS)
  const storyChannel    = ref(null)
  const queueChannel    = ref(null)
  let turnTimer     = null
  let typingTimeout = null

  // ── Helpers ────────────────────────────────────────────
  function setCurrentStory(story) {
    currentStory.value = story
    inQueue.value = false
  }

  function startTurnTimer() {
    clearInterval(turnTimer)
    turnSecondsLeft.value = TURN_SECONDS
    turnTimer = setInterval(async () => {
      turnSecondsLeft.value--
      if (turnSecondsLeft.value <= 0) {
        clearInterval(turnTimer)
        if (isBotGame.value) await triggerBotTurn()
        else await autoSkipTurn()
      }
    }, 1000)
  }

  async function autoSkipTurn() {
    const auth = useAuthStore()
    const story = currentStory.value
    if (!story || story.turn !== auth.user.id) return
    const nextTurn = story.player1_id === auth.user.id ? story.player2_id : story.player1_id
    await supabase.from('stories').update({ turn: nextTurn }).eq('id', story.id)
  }

  // ── Bot game ───────────────────────────────────────────
  async function startBotStory() {
    const auth = useAuthStore()
    isBotGame.value = true

    // Create a local bot story (no real player2 in DB — use auth user as both)
    // We store BOT_ID as player2 conceptually but use user's id for DB constraints
    const { data: story } = await supabase
      .from('stories')
      .insert({
        player1_id: auth.user.id,
        player2_id: auth.user.id, // bot shares the slot
        status: 'active',
        turn: auth.user.id,
        prompt: null
      })
      .select()
      .single()

    if (!story) return
    setCurrentStory(story)
    sentences.value = []
    listenToStory(story.id)
  }

  async function triggerBotTurn() {
    if (!isBotGame.value || !currentStory.value) return
    botThinking.value = true

    // Simulate typing delay like a real person (1.5–4s)
    const delay = 1500 + Math.random() * 2500
    await new Promise(r => setTimeout(r, delay))

    const text = await getBotSentence(sentences.value, GROQ_KEY)
    botThinking.value = false

    const auth = useAuthStore()
    const story = currentStory.value
    const isComplete = sentences.value.length + 1 >= 10

    // Insert bot sentence attributed to the user's id but marked with bot username via profile workaround
    // We insert with user's id and store bot name in a separate way — simplest: just insert normally
    // and the UI shows "GhostWriter" based on isBotGame flag
    await supabase.from('sentences').insert({
      story_id: story.id,
      user_id: auth.user.id, // needed for RLS — bot reuses auth user slot
      text,
      votes: 0,
      reported: false,
    })

    await supabase.from('stories').update({
      turn: isComplete ? null : auth.user.id,
      status: isComplete ? 'complete' : 'active'
    }).eq('id', story.id)
  }

  // ── Queue ──────────────────────────────────────────────
  async function joinQueue(genre = 'any') {
    const auth = useAuthStore()
    inQueue.value = true
    await supabase.from('queue').upsert({ user_id: auth.user.id, genre })
  }

  async function leaveQueue() {
    const auth = useAuthStore()
    inQueue.value = false
    await supabase.from('queue').delete().eq('user_id', auth.user.id)
    if (queueChannel.value) {
      supabase.removeChannel(queueChannel.value)
      queueChannel.value = null
    }
  }

  async function tryMatchmaking(genre = 'any') {
    const auth = useAuthStore()
    const { data, error } = await supabase.rpc('match_players', {
      p_user_id: auth.user.id,
      p_genre: genre
    })
    if (error) { console.error('matchmaking rpc error', error); return }
    if (data) {
      const { data: story } = await supabase
        .from('stories').select('*').eq('id', data).single()
      if (story) {
        isBotGame.value = false
        setCurrentStory(story)
        await loadSentences(story.id)
        startTurnTimer()
      }
    }
  }

  // ── Sentences ──────────────────────────────────────────
  function listenToStory(storyId) {
    if (storyChannel.value) {
      supabase.removeChannel(storyChannel.value)
      storyChannel.value = null
    }
    const ch = supabase.channel(`story-${storyId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'sentences',
        filter: `story_id=eq.${storyId}`
      }, async () => {
        const { data: fresh } = await supabase
          .from('sentences').select('*, profiles(username)')
          .eq('story_id', storyId).order('created_at', { ascending: true })
        sentences.value = fresh || []
        const { data: s } = await supabase.from('stories').select('*').eq('id', storyId).single()
        if (s) currentStory.value = s
        // In bot game, after INSERT fires and sentences are fresh → trigger bot
        if (isBotGame.value && s?.status === 'active') {
          // Only trigger if it's NOT the user's turn (meaning user just went)
          const auth = useAuthStore()
          if (s?.turn === auth.user.id) {
            // Bot already responded, it's user's turn again — just wait
            startTurnTimer()
          } else {
            // User just submitted — bot goes now
            partnerTyping.value = true
            await triggerBotTurn()
            partnerTyping.value = false
          }
        } else {
          startTurnTimer()
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'stories',
        filter: `id=eq.${storyId}`
      }, (p) => { currentStory.value = p.new })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'typing',
        filter: `story_id=eq.${storyId}`
      }, (p) => {
        const auth = useAuthStore()
        if (p.new?.user_id && p.new.user_id !== auth.user.id) {
          partnerTyping.value = true
          clearTimeout(typingTimeout)
          typingTimeout = setTimeout(() => { partnerTyping.value = false }, 3000)
        }
        if (p.eventType === 'DELETE') partnerTyping.value = false
      })
      .subscribe()
    storyChannel.value = ch
  }

  async function loadSentences(storyId) {
    const { data } = await supabase
      .from('sentences').select('*, profiles(username)')
      .eq('story_id', storyId).order('created_at', { ascending: true })
    sentences.value = data || []
    listenToStory(storyId)
  }

  async function addSentence(text) {
    const auth = useAuthStore()
    const story = currentStory.value
    if (!story || story.turn !== auth.user.id) return
    clearInterval(turnTimer)

    const isComplete = sentences.value.length + 1 >= 10
    const nextTurn = story.player1_id === auth.user.id ? story.player2_id : story.player1_id

    await supabase.from('sentences').insert({
      story_id: story.id, user_id: auth.user.id,
      text, votes: 0, reported: false
    })
    await supabase.from('stories').update({
      turn: isComplete ? null : (isBotGame.value ? auth.user.id : nextTurn),
      status: isComplete ? 'complete' : 'active'
    }).eq('id', story.id)

    await clearTyping()
  }

  // ── Typing ─────────────────────────────────────────────
  async function sendTyping() {
    const auth = useAuthStore()
    if (!currentStory.value) return
    await supabase.from('typing').upsert({
      user_id: auth.user.id,
      story_id: currentStory.value.id,
      updated_at: new Date().toISOString()
    })
  }

  async function clearTyping() {
    const auth = useAuthStore()
    await supabase.from('typing').delete().eq('user_id', auth.user.id)
  }

  // ── Votes / Reports ────────────────────────────────────
  async function voteSentence(sentenceId, current) {
    await supabase.from('sentences').update({ votes: current + 1 }).eq('id', sentenceId)
    sentences.value = sentences.value.map(s =>
      s.id === sentenceId ? { ...s, votes: s.votes + 1 } : s
    )
  }

  async function reportSentence(sentenceId) {
    await supabase.from('sentences').update({ reported: true }).eq('id', sentenceId)
    sentences.value = sentences.value.map(s =>
      s.id === sentenceId ? { ...s, reported: true } : s
    )
  }

  // ── Library ────────────────────────────────────────────
  async function saveStory() {
    const auth = useAuthStore()
    await supabase.from('saved_stories').insert({
      user_id: auth.user.id,
      story_id: currentStory.value.id
    })
  }

  async function loadSavedStories() {
    const auth = useAuthStore()
    const { data } = await supabase
      .from('saved_stories')
      .select('*, stories(*, sentences(*, profiles(username)))')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
    savedStories.value = data || []
  }

  function exportStory(storyData, sentenceData) {
    const lines = sentenceData.map((s, i) =>
      `${i + 1}. [${s.profiles?.username ?? 'Unknown'}] ${s.text}`
    )
    const content = `ONELINE STORY\n${'─'.repeat(40)}\n\n${lines.join('\n')}\n\n${'─'.repeat(40)}\nSaved from oneline.app`
    const blob = new Blob([content], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `oneline-story-${storyData.id.slice(0, 8)}.txt`
    a.click()
  }

  function reset() {
    clearInterval(turnTimer)
    if (storyChannel.value) {
      supabase.removeChannel(storyChannel.value)
      storyChannel.value = null
    }
    currentStory.value    = null
    sentences.value       = []
    inQueue.value         = false
    isBotGame.value       = false
    botThinking.value     = false
    partnerTyping.value   = false
    turnSecondsLeft.value = TURN_SECONDS
  }

  return {
    currentStory, sentences, inQueue, savedStories,
    partnerTyping, turnSecondsLeft, isBotGame, botThinking,
    joinQueue, leaveQueue, tryMatchmaking,
    setCurrentStory, startTurnTimer, loadSentences,
    startBotStory, triggerBotTurn,
    addSentence, sendTyping, clearTyping,
    voteSentence, reportSentence,
    saveStory, loadSavedStories, exportStory, reset,
  }
})
