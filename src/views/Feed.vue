<template>
  <div class="pt-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="font-display text-3xl font-600">Story Feed</h2>
        <p class="text-sm opacity-50 mt-1">Completed stories from strangers around the world</p>
      </div>
      <div class="flex gap-2">
        <button v-for="tab in tabs" :key="tab.key"
          @click="activeTab = tab.key"
          :class="['tag text-xs cursor-pointer border-none', activeTab === tab.key ? 'bg-brand-orange text-white' : 'bg-brand-warm text-brand-brown hover:bg-orange-100']">
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Top this week leaderboard -->
    <div v-if="activeTab === 'top'" class="mb-6">
      <div class="card bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-brand-surface dark:to-brand-surface border-yellow-200 dark:border-brand-border mb-4">
        <p class="text-xs font-600 text-brand-orange mb-3">🏆 Top Stories This Week</p>
        <div v-if="topStories.length === 0" class="text-center py-4 opacity-40 text-sm">No stories yet this week</div>
        <div v-for="(s, i) in topStories" :key="s.id" class="flex items-center gap-3 py-2 border-b border-orange-100 dark:border-brand-border last:border-0">
          <span class="font-display text-2xl font-600 text-brand-orange w-6 shrink-0">{{ i + 1 }}</span>
          <div class="flex-1 min-w-0">
            <p class="font-display italic text-sm leading-relaxed truncate opacity-80">
              "{{ firstSentence(s) }}"
            </p>
            <p class="text-xs opacity-40 mt-0.5">{{ s.total_votes }} votes · {{ s.sentences?.length ?? 0 }} sentences</p>
          </div>
          <button @click="expanded = expanded === s.id ? null : s.id"
            class="text-xs text-brand-orange border-none bg-transparent cursor-pointer shrink-0">
            {{ expanded === s.id ? 'Less' : 'Read' }}
          </button>
        </div>
      </div>
    </div>

    <!-- All stories feed -->
    <div v-if="loading" class="text-center py-16 opacity-40">
      <div class="w-8 h-8 rounded-full border-3 border-brand-orange border-t-transparent animate-spin mx-auto mb-3" />
      <p class="text-sm">Loading stories…</p>
    </div>

    <div v-else-if="stories.length === 0" class="text-center py-16 card border-dashed">
      <p class="font-display text-2xl italic opacity-40 mb-2">No stories yet</p>
      <p class="text-sm opacity-40">Be the first to complete one!</p>
      <router-link to="/queue" class="btn-primary inline-block mt-6 no-underline text-white">Start writing →</router-link>
    </div>

    <div v-else class="space-y-4">
      <div v-for="story in stories" :key="story.id" class="card hover:border-orange-200 transition-colors">
        <div class="flex items-start gap-3">
          <div class="flex-1 min-w-0">
            <p class="font-display italic text-sm leading-relaxed opacity-80 line-clamp-2">
              "{{ firstSentence(story) }}"
            </p>
            <div class="flex items-center gap-3 mt-2">
              <span class="text-xs opacity-40">{{ story.sentences?.length ?? 0 }} sentences</span>
              <span class="text-xs opacity-40">{{ formatDate(story.created_at) }}</span>
              <span v-if="story.genre !== 'any'" class="tag text-xs bg-brand-warm text-brand-brown">{{ story.genre }}</span>
            </div>
          </div>
          <div class="flex flex-col items-center gap-1 shrink-0">
            <button @click="voteStory(story)"
              class="flex flex-col items-center gap-0.5 text-brand-orange hover:text-orange-600 border-none bg-transparent cursor-pointer p-1">
              <span class="text-lg leading-none">♥</span>
              <span class="text-xs font-600">{{ story.total_votes ?? 0 }}</span>
            </button>
          </div>
        </div>

        <div v-if="expanded === story.id" class="mt-4 pt-4 border-t border-orange-100 dark:border-brand-border space-y-3">
          <div v-for="(s, i) in story.sentences" :key="s.id" class="flex gap-3">
            <span class="text-xs opacity-30 w-4 shrink-0 mt-1">{{ i + 1 }}</span>
            <div>
              <p class="font-display italic text-sm leading-relaxed">{{ s.text }}</p>
              <span class="tag text-xs bg-brand-orange/10 text-brand-orange mt-1">{{ i % 2 === 0 ? 'User 1' : 'User 2' }}</span>
            </div>
          </div>
        </div>

        <button @click="expanded = expanded === story.id ? null : story.id"
          class="text-xs text-brand-orange mt-3 border-none bg-transparent cursor-pointer p-0">
          {{ expanded === story.id ? '▲ Collapse' : '▼ Read full story' }}
        </button>
      </div>

      <div v-if="hasMore" class="text-center pt-2">
        <button @click="loadMore" class="btn-ghost text-sm">Load more</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '@/lib/supabase'

const loading    = ref(true)
const stories    = ref([])
const topStories = ref([])
const expanded   = ref(null)
const activeTab  = ref('recent')
const page       = ref(0)
const hasMore    = ref(false)
const PAGE_SIZE  = 10

const tabs = [
  { key: 'recent', label: '🕐 Recent' },
  { key: 'top',    label: '🏆 Top' },
]

async function fetchStories(reset = false) {
  if (reset) { stories.value = []; page.value = 0 }
  loading.value = true
  const from = page.value * PAGE_SIZE
  const { data } = await supabase
    .from('stories')
    .select('*, sentences(*, profiles!sentences_user_id_fkey(username))')
    .eq('status', 'complete')
    .order(activeTab.value === 'top' ? 'total_votes' : 'created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
  hasMore.value = (data?.length ?? 0) === PAGE_SIZE
  stories.value = reset ? (data ?? []) : [...stories.value, ...(data ?? [])]
  loading.value = false
}

async function fetchTop() {
  const { data } = await supabase
    .from('stories')
    .select('*, sentences(*, profiles!sentences_user_id_fkey(username))')
    .eq('status', 'complete')
    .order('total_votes', { ascending: false })
    .limit(5)
  topStories.value = data ?? []
}

async function voteStory(story) {
  const newVotes = (story.total_votes ?? 0) + 1
  await supabase.from('stories').update({ total_votes: newVotes }).eq('id', story.id)
  story.total_votes = newVotes
}

function loadMore() { page.value++; fetchStories() }
function firstSentence(s) { return s.sentences?.[0]?.text ?? 'Empty story' }
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

watch(activeTab, () => fetchStories(true))
onMounted(() => { fetchStories(true); fetchTop() })
</script>
