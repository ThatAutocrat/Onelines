<template>
  <div class="pt-6">
    <div class="flex items-center justify-between mb-8">
      <h2 class="font-display text-3xl font-600">My Library</h2>
      <router-link to="/" class="text-sm opacity-50 hover:opacity-80 transition-opacity no-underline text-current">
        ← Back
      </router-link>
    </div>

    <div v-if="loading" class="text-center py-16 opacity-40">
      <div class="w-8 h-8 rounded-full border-3 border-brand-orange border-t-transparent animate-spin mx-auto" />
    </div>

    <div v-else-if="stories.length === 0" class="text-center py-16 card border-dashed">
      <p class="font-display text-2xl italic opacity-40 mb-2">No stories yet</p>
      <p class="text-sm opacity-40">Complete a story and save it here</p>
      <router-link to="/queue" class="btn-primary inline-block mt-6 no-underline text-white">
        Write one now →
      </router-link>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="item in stories"
        :key="item.id"
        class="card hover:border-orange-200 dark:hover:border-brand-orange/40 transition-colors cursor-pointer"
        @click="expanded = expanded === item.id ? null : item.id"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <p class="font-display italic text-sm leading-relaxed line-clamp-2 opacity-80">
              "{{ firstSentence(item) }}"
            </p>
            <p class="text-xs opacity-40 mt-2">
              {{ item.stories?.sentences?.length ?? 0 }} sentences · {{ formatDate(item.created_at) }}
            </p>
          </div>
          <div class="flex gap-2 shrink-0">
            <button @click.stop="exportStory(item)" class="tag bg-brand-warm dark:bg-brand-border text-brand-brown dark:text-brand-cream text-xs hover:bg-orange-100 dark:hover:bg-brand-surface transition-colors border-none cursor-pointer">
              ↓ Export
            </button>
          </div>
        </div>

        <div v-if="expanded === item.id" class="mt-4 pt-4 border-t border-orange-100 dark:border-brand-border space-y-3">
          <div v-for="(s, i) in item.stories?.sentences" :key="s.id" class="flex gap-3 items-start">
            <span class="text-xs opacity-30 w-4 shrink-0 mt-1">{{ i + 1 }}</span>
            <div>
              <p class="font-display italic text-sm leading-relaxed">{{ s.text }}</p>
              <span class="tag text-xs bg-brand-orange/10 text-brand-orange mt-1">
                {{ s.profiles?.username ?? 'Unknown' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStoryStore } from '@/stores/story'

const storyStore = useStoryStore()
const loading    = ref(true)
const expanded   = ref(null)

const stories = computed(() => storyStore.savedStories)

function firstSentence(item) {
  return item.stories?.sentences?.[0]?.text ?? 'Empty story'
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function exportStory(item) {
  storyStore.exportStory(item.stories, item.stories?.sentences ?? [])
}

onMounted(async () => {
  await storyStore.loadSavedStories()
  loading.value = false
})
</script>
