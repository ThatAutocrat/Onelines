<template>
  <div class="pt-6">
    <!-- Bot game banner -->
    <div v-if="storyStore.isBotGame" class="flex items-center gap-2 mb-4 px-3 py-2 rounded-2xl bg-brand-warm dark:bg-brand-surface border border-orange-200 dark:border-brand-border text-sm dark:text-brand-cream">
      <span>👻</span>
      <span class="opacity-70">Writing with a <strong>Ghost Writer</strong> — no real stranger was found</span>
    </div>

    <!-- Prompt card -->
    <div v-if="story?.prompt && sentences.length === 0" class="card mb-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
      <p class="text-xs font-500 text-brand-orange mb-1">✨ Opening prompt</p>
      <p class="font-display italic text-sm leading-relaxed opacity-80">{{ story.prompt }}</p>
      <p class="text-xs opacity-40 mt-1">Use this to start, or write your own</p>
    </div>

    <!-- Progress -->
    <div class="flex items-center justify-between mb-4">
      <span class="tag bg-brand-orange/10 text-brand-orange text-xs">{{ sentences.length }}/10 sentences</span>
      <div class="flex items-center gap-3">
        <div v-if="isMyTurn && !storyStore.isBotGame"
          :class="['text-xs font-600 tabular-nums', timerWarning ? 'text-red-500 animate-pulse' : 'opacity-40']">
          ⏱ {{ mmss(storyStore.turnSecondsLeft) }}
        </div>
        <div class="w-28 h-2 bg-orange-100 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-brand-orange to-brand-coral rounded-full transition-all duration-500"
            :style="{ width: `${(sentences.length / 10) * 100}%` }" />
        </div>
      </div>
    </div>

    <!-- Sentences -->
    <div class="card mb-4 min-h-48 space-y-4">
      <div v-if="sentences.length === 0" class="text-center py-8 opacity-40">
        <p class="font-display text-xl italic">The story begins with you…</p>
      </div>

      <transition-group name="sentence" tag="div" class="space-y-4">
        <div v-for="(s, i) in sentences" :key="s.id"
          :class="['flex gap-3 items-start group', s.reported ? 'opacity-30' : '']">
          <div class="shrink-0">
            <span :class="['tag text-xs', isUserSentence(s, i) ? 'bg-brand-orange/15 text-brand-orange' : 'bg-brand-yellow/30 text-brand-brown']">
              {{ getSentenceAuthor(s, i) }}
            </span>
          </div>
          <div class="flex-1">
            <p class="text-sm leading-relaxed font-display italic">{{ s.text }}</p>
            <div class="flex items-center gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button @click="vote(s)" class="text-xs flex items-center gap-1 text-brand-orange hover:text-orange-600 border-none bg-transparent cursor-pointer p-0">
                ♥ {{ s.votes }}
              </button>
              <button v-if="!s.reported && !isUserSentence(s, i)" @click="report(s)"
                class="text-xs opacity-40 hover:opacity-70 border-none bg-transparent cursor-pointer p-0 text-current">
                report
              </button>
            </div>
          </div>
          <span class="text-xs opacity-20 shrink-0 self-center">{{ i + 1 }}</span>
        </div>
      </transition-group>
    </div>

    <!-- Bot thinking indicator -->
    <transition name="fade">
      <div v-if="storyStore.botThinking" class="flex items-center gap-2 mb-3 px-1">
        <div class="flex gap-1">
          <span class="w-2 h-2 bg-brand-orange/60 rounded-full animate-bounce" style="animation-delay:0ms" />
          <span class="w-2 h-2 bg-brand-orange/60 rounded-full animate-bounce" style="animation-delay:150ms" />
          <span class="w-2 h-2 bg-brand-orange/60 rounded-full animate-bounce" style="animation-delay:300ms" />
        </div>
        <span class="text-xs opacity-50">Ghost Writer is writing…</span>
      </div>
      <!-- Real partner typing -->
      <div v-else-if="storyStore.partnerTyping && !isMyTurn" class="flex items-center gap-2 mb-3 px-1">
        <div class="flex gap-1">
          <span class="w-2 h-2 bg-brand-orange/60 rounded-full animate-bounce" style="animation-delay:0ms" />
          <span class="w-2 h-2 bg-brand-orange/60 rounded-full animate-bounce" style="animation-delay:150ms" />
          <span class="w-2 h-2 bg-brand-orange/60 rounded-full animate-bounce" style="animation-delay:300ms" />
        </div>
        <span class="text-xs opacity-50">your co-author is writing…</span>
      </div>
    </transition>

    <!-- Input -->
    <div v-if="isMyTurn && !storyStore.botThinking" class="card border-brand-orange/30 border-2">
      <p class="text-xs font-500 text-brand-orange mb-3">Your turn — add the next sentence</p>
      <textarea
        v-model="input"
        @keydown.enter.exact.prevent="submit"
        @input="onInput"
        rows="3"
        maxlength="280"
        placeholder="Continue the story…"
        class="w-full bg-transparent border-none resize-none outline-none font-display text-base italic placeholder-opacity-30 text-current leading-relaxed"
      />
      <div class="flex items-center justify-between mt-3">
        <span class="text-xs opacity-30">{{ input.length }}/280 · Enter to submit</span>
        <button :disabled="!input.trim() || submitting" @click="submit"
          class="btn-primary text-sm py-2 px-5 disabled:opacity-30 disabled:cursor-not-allowed">
          {{ submitting ? 'Sending…' : 'Add sentence →' }}
        </button>
      </div>
    </div>

    <div v-else-if="!isMyTurn && !storyStore.botThinking" class="card text-center py-8 border-dashed border-2 border-orange-200">
      <div class="flex items-center justify-center gap-2 opacity-60">
        <span class="w-2 h-2 bg-brand-orange rounded-full animate-pulse" />
        <p class="text-sm font-500">
          {{ storyStore.isBotGame ? 'Ghost Writer is thinking…' : 'Waiting for your co-author…' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter }     from 'vue-router'
import { useStoryStore } from '@/stores/story'
import { useAuthStore }  from '@/stores/auth'
import { playTypeClick, playSubmit } from '@/lib/sounds'
import { BOT_USERNAME }  from '@/lib/bot'

const router     = useRouter()
const storyStore = useStoryStore()
const authStore  = useAuthStore()
const input      = ref('')
const submitting = ref(false)

const sentences    = computed(() => storyStore.sentences)
const story        = computed(() => storyStore.currentStory)
const isMyTurn     = computed(() => story.value?.turn === authStore.user?.id && !submitting.value)
const timerWarning = computed(() => storyStore.turnSecondsLeft <= 60)

function isUserSentence(s, i) {
  if (!storyStore.isBotGame) return s.user_id === authStore.user?.id
  return i % 2 === 0
}

function getSentenceAuthor(s, i) {
  if (!storyStore.isBotGame) {
    return s.user_id === authStore.user?.id ? 'You' : (s.profiles?.username ?? 'Stranger')
  }
  return i % 2 === 0 ? 'You' : BOT_USERNAME
}

function mmss(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

let typingDebounce = null
function onInput() {
  playTypeClick()
  clearTimeout(typingDebounce)
  typingDebounce = setTimeout(() => storyStore.sendTyping(), 300)
}

async function submit() {
  if (!input.value.trim() || submitting.value) return
  submitting.value = true
  playSubmit()
  await storyStore.addSentence(input.value.trim())
  input.value = ''
  submitting.value = false
}

async function vote(s)   { await storyStore.voteSentence(s.id, s.votes) }
async function report(s) { await storyStore.reportSentence(s.id) }

watch(story, (s) => { if (s?.status === 'complete') router.push('/complete') })
onMounted(() => { if (!storyStore.currentStory) router.push('/') })
</script>

<style scoped>
.sentence-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.sentence-enter-from   { opacity: 0; transform: translateY(12px) scale(0.97); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
