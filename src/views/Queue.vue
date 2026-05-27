<template>
  <div class="pt-12 text-center">
    <div class="mb-10">
      <div class="w-24 h-24 rounded-full bg-brand-orange/10 flex items-center justify-center mx-auto mb-6 relative">
        <span class="text-4xl">✍️</span>
        <div class="absolute inset-0 rounded-full border-3 border-brand-orange/30 border-t-brand-orange animate-spin" />
      </div>
      <h2 class="font-display text-3xl font-600 mb-3">Finding your co-author…</h2>
      <p class="opacity-60 text-sm">{{ dots }}</p>
    </div>

    <div class="card mb-8 text-left">
      <p class="text-sm font-500 opacity-50 mb-2">While you wait, here's the vibe:</p>
      <p class="font-display text-xl italic text-brand-orange leading-relaxed">
        "{{ prompt }}"
      </p>
      <p class="text-xs opacity-40 mt-2">Use this as your opening line if you want ✨</p>
    </div>

    <!-- Bot countdown notice -->
    <transition name="fade">
      <div v-if="botCountdown > 0 && botCountdown <= 15" class="card mb-6 bg-brand-warm border-orange-200 text-sm">
        <p class="opacity-70">No one found yet — a ghost writer joins in <strong>{{ botCountdown }}s</strong> 👻</p>
      </div>
    </transition>

    <div class="flex items-center gap-3 justify-center mb-10">
      <span class="w-2 h-2 bg-brand-orange rounded-full animate-bounce" style="animation-delay:0ms" />
      <span class="w-2 h-2 bg-brand-yellow rounded-full animate-bounce" style="animation-delay:150ms" />
      <span class="w-2 h-2 bg-brand-coral rounded-full animate-bounce" style="animation-delay:300ms" />
    </div>

    <button @click="cancel" class="btn-ghost text-sm">Cancel</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter }     from 'vue-router'
import { useStoryStore } from '@/stores/story'
import { useAuthStore }  from '@/stores/auth'
import { supabase }      from '@/lib/supabase'
import { BOT_WAIT_MS }   from '@/lib/bot'

const router     = useRouter()
const storyStore = useStoryStore()
const authStore  = useAuthStore()

const prompts = [
  'The last train had already left when she noticed the envelope on the bench.',
  'Nobody believed him until the photographs surfaced three weeks later.',
  'Every morning the bakery smelled of cinnamon — until the day it didn\'t.',
  'The map had one road that didn\'t exist on any satellite image.',
  'He returned the library book forty years late with a single apology note.',
  'The door at the end of the hall had never been locked before tonight.',
]

const prompt      = prompts[Math.floor(Math.random() * prompts.length)]
const dots        = ref('Looking for someone nearby…')
const botCountdown = ref(Math.ceil(BOT_WAIT_MS / 1000))
const cancelled   = ref(false)

let matchInterval  = null
let dotInterval    = null
let countdownTimer = null
let botTimer       = null
let dotIdx = 0
const dotStates = ['Looking for someone nearby…', 'Scanning the writing room…', 'Almost there…', 'Hang tight…']

function clearAll() {
  clearInterval(matchInterval)
  clearInterval(dotInterval)
  clearInterval(countdownTimer)
  clearTimeout(botTimer)
  matchInterval = dotInterval = countdownTimer = botTimer = null
}

async function checkForMatch() {
  if (cancelled.value) return

  await storyStore.tryMatchmaking()
  if (storyStore.currentStory) { clearAll(); router.push('/story'); return }

  // Also check if matched as player2
  const { data } = await supabase
    .from('stories')
    .select('*')
    .or(`player1_id.eq.${authStore.user.id},player2_id.eq.${authStore.user.id}`)
    .eq('status', 'active')
    .maybeSingle()

  if (data && !cancelled.value) {
    storyStore.setCurrentStory(data)
    await storyStore.loadSentences(data.id)
    storyStore.startTurnTimer()
    clearAll()
    router.push('/story')
  }
}

async function startBotGame() {
  if (cancelled.value) return
  clearAll()
  await storyStore.leaveQueue()
  await storyStore.startBotStory()
  if (!cancelled.value) router.push('/story')
}

onMounted(async () => {
  await storyStore.joinQueue()

  // Dot animation
  dotInterval = setInterval(() => {
    dotIdx = (dotIdx + 1) % dotStates.length
    dots.value = dotStates[dotIdx]
  }, 2500)

  // Match polling with jitter
  const jitter = Math.random() * 1500
  setTimeout(() => {
    if (cancelled.value) return
    matchInterval = setInterval(checkForMatch, 3000)
    checkForMatch()
  }, jitter)

  // Countdown ticker
  countdownTimer = setInterval(() => {
    if (botCountdown.value > 0) botCountdown.value--
  }, 1000)

  // Bot fallback after 30s
  botTimer = setTimeout(startBotGame, BOT_WAIT_MS)
})

onUnmounted(() => { clearAll() })

async function cancel() {
  cancelled.value = true
  clearAll()
  await storyStore.leaveQueue()
  router.push('/')
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
