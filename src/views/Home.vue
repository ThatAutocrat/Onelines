<template>
  <div class="pt-8 pb-16">
    <div class="text-center mb-12">
      <div class="inline-block mb-4 px-4 py-2 bg-brand-yellow/30 rounded-full text-sm font-500 text-brand-brown">
        ✨ Collaborative storytelling
      </div>
      <h1 class="font-display text-5xl font-600 leading-tight mb-4">
        One sentence.<br />
        <span class="text-brand-orange italic">Infinite stories.</span>
      </h1>
      <p class="text-lg opacity-60 max-w-md mx-auto leading-relaxed">
        Get matched with a stranger. Take turns adding one sentence at a time. See where the story goes.
      </p>
    </div>

    <div class="grid grid-cols-3 gap-4 mb-10">
      <div v-for="step in steps" :key="step.n" class="card text-center py-6">
        <div class="text-3xl mb-2">{{ step.emoji }}</div>
        <div class="font-display text-2xl font-600 text-brand-orange mb-1">{{ step.n }}</div>
        <div class="text-sm opacity-60">{{ step.label }}</div>
      </div>
    </div>

    <div class="card mb-6 bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
      <div class="flex items-center gap-2 mb-3">
        <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
        <span class="text-sm font-500 opacity-60">Example story</span>
      </div>
      <div class="space-y-3">
        <div v-for="(line, i) in exampleLines" :key="i" class="flex gap-3 items-start">
          <span class="tag bg-brand-orange/10 text-brand-orange shrink-0">{{ line.user }}</span>
          <p class="text-sm leading-relaxed italic opacity-80">{{ line.text }}</p>
        </div>
      </div>
    </div>

    <div class="text-center space-y-3">
      <p class="text-sm opacity-50">
        Playing as <strong>{{ authStore.profile?.username ?? '...' }}</strong>
      </p>
      <button @click="goQueue" class="btn-primary text-lg px-10 py-4 w-full">
        Find a co-author →
      </button>
      <router-link to="/library" class="btn-ghost text-sm block text-center no-underline">
        My saved stories
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter }    from 'vue-router'

const authStore = useAuthStore()
const router    = useRouter()

const steps = [
  { n: '01', emoji: '🎲', label: 'Get matched' },
  { n: '02', emoji: '✍️', label: 'Write a line' },
  { n: '03', emoji: '📖', label: 'Finish together' },
]

const exampleLines = [
  { user: 'CosmicFox12', text: 'The lighthouse had been dark for thirty years when Marina finally climbed its rusted stairs.' },
  { user: 'VelvetRaven7', text: 'She found, at the very top, a child\'s drawing of the sun taped to the broken lens.' },
  { user: 'CosmicFox12', text: 'Below it, in faded pencil: "For whoever needs light the most."' },
]

function goQueue() {
  router.push('/queue')
}
</script>
