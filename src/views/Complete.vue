<template>
  <div class="pt-8 text-center">
    <div class="mb-8">
      <div class="text-6xl mb-4">🎉</div>
      <h2 class="font-display text-4xl font-600 mb-2">Story complete!</h2>
      <p class="opacity-60 text-sm">You and a stranger wrote something together.</p>
    </div>

    <div class="card mb-6 text-left bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
      <div class="space-y-4">
        <div v-for="(s, i) in sentences" :key="s.id" class="flex gap-3 items-start group">
          <span class="text-xs opacity-30 w-4 shrink-0 mt-1">{{ i + 1 }}</span>
          <div class="flex-1">
            <p class="font-display italic text-sm leading-relaxed mb-1">{{ s.text }}</p>
            <div class="flex items-center gap-3">
              <span :class="['tag text-xs', isMe(s.user_id) ? 'bg-brand-orange/15 text-brand-orange' : 'bg-brand-yellow/30 text-brand-brown']">
                {{ isMe(s.user_id) ? 'You' : (s.profiles?.username ?? 'Stranger') }}
              </span>
              <button @click="vote(s)" class="text-xs flex items-center gap-1 text-brand-orange hover:text-orange-600 border-none bg-transparent cursor-pointer p-0">
                ♥ {{ s.votes }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-3">
      <button @click="save" :disabled="saved" class="btn-primary">
        {{ saved ? '✓ Saved to library' : '📚 Save to library' }}
      </button>
      <button @click="exportIt" class="btn-ghost">↓ Export as .txt</button>
      <button @click="newStory" class="text-sm opacity-50 hover:opacity-80 transition-opacity border-none bg-transparent cursor-pointer text-current mt-2">
        Write another story →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter }     from 'vue-router'
import { useStoryStore } from '@/stores/story'
import { useAuthStore }  from '@/stores/auth'
import { fireConfetti }  from '@/lib/confetti'
import { playComplete }  from '@/lib/sounds'

const router     = useRouter()
const storyStore = useStoryStore()
const authStore  = useAuthStore()
const saved      = ref(false)

const sentences = computed(() => storyStore.sentences)
function isMe(uid) { return uid === authStore.user?.id }
async function vote(s) { await storyStore.voteSentence(s.id, s.votes) }

async function save() {
  await storyStore.saveStory()
  saved.value = true
}

function exportIt() { storyStore.exportStory(storyStore.currentStory, sentences.value) }

function newStory() {
  storyStore.reset()
  router.push('/queue')
}

onMounted(() => {
  if (!storyStore.currentStory) { router.push('/'); return }
  fireConfetti()
  playComplete()
})
</script>
