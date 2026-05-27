<template>
  <div :class="['min-h-screen transition-colors duration-300', dark ? 'dark bg-brand-dark text-brand-cream' : 'bg-brand-cream text-brand-dark']">

    <!-- Offline banner -->
    <transition name="slide-down">
      <div v-if="!online" class="bg-red-500 text-white text-center text-sm py-2 font-500 flex items-center justify-center gap-2">
        <span>⚠️</span> You're offline — some features may not work
      </div>
    </transition>

    <header class="flex items-center justify-between px-6 py-4 max-w-2xl mx-auto">
      <router-link to="/" class="font-display text-2xl font-600 text-brand-orange no-underline">
        Oneline
      </router-link>
      <div class="flex items-center gap-3">
        <router-link to="/feed"    class="text-sm font-500 opacity-60 hover:opacity-100 transition-opacity no-underline text-current">Feed</router-link>
        <router-link to="/library" class="text-sm font-500 opacity-60 hover:opacity-100 transition-opacity no-underline text-current">Library</router-link>
        <button @click="toggleSound" :title="soundOn ? 'Mute sounds' : 'Enable sounds'"
          class="w-9 h-9 rounded-full flex items-center justify-center bg-brand-warm hover:bg-orange-100 transition-colors border-none cursor-pointer text-base">
          {{ soundOn ? '🔊' : '🔇' }}
        </button>
        <button @click="dark = !dark"
          class="w-9 h-9 rounded-full flex items-center justify-center bg-brand-warm hover:bg-orange-100 transition-colors border-none cursor-pointer text-lg">
          {{ dark ? '☀️' : '🌙' }}
        </button>
      </div>
    </header>

    <main class="max-w-2xl mx-auto px-6 pb-12">
      <div v-if="authStore.loading" class="flex items-center justify-center h-64">
        <div class="w-8 h-8 rounded-full border-3 border-brand-orange border-t-transparent animate-spin" />
      </div>
      <router-view v-else />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { setSoundEnabled, isSoundEnabled } from '@/lib/sounds'

const dark     = ref(false)
const online   = ref(navigator.onLine)
const soundOn  = ref(true)
const authStore = useAuthStore()

function toggleSound() {
  soundOn.value = !soundOn.value
  setSoundEnabled(soundOn.value)
}

function handleOnline()  { online.value = true }
function handleOffline() { online.value = false }

onMounted(async () => {
  dark.value = localStorage.getItem('oneline-dark') === 'true'
    || window.matchMedia('(prefers-color-scheme: dark)').matches
  soundOn.value = localStorage.getItem('oneline-sound') !== 'false'
  setSoundEnabled(soundOn.value)
  window.addEventListener('online',  handleOnline)
  window.addEventListener('offline', handleOffline)
  await authStore.init()
})

onUnmounted(() => {
  window.removeEventListener('online',  handleOnline)
  window.removeEventListener('offline', handleOffline)
})

import { watch } from 'vue'
watch(dark,    v => localStorage.setItem('oneline-dark',  v))
watch(soundOn, v => localStorage.setItem('oneline-sound', v))
</script>

<style>
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.3s ease; }
.slide-down-enter-from, .slide-down-leave-to { transform: translateY(-100%); opacity: 0; }
</style>
