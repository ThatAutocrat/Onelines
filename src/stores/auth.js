import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { generateUsername } from '@/lib/username'

export const useAuthStore = defineStore('auth', () => {
  const user     = ref(null)
  const profile  = ref(null)
  const loading  = ref(true)

  async function init() {
    loading.value = true
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      user.value = session.user
      await loadProfile()
    } else {
      await signInAnonymously()
    }
    loading.value = false

    supabase.auth.onAuthStateChange(async (_event, session) => {
      user.value = session?.user ?? null
      if (user.value) await loadProfile()
    })
  }

  async function signInAnonymously() {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) { console.error(error); return }
    user.value = data.user
    await createProfile()
  }

  async function loadProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()
    if (data) profile.value = data
    else await createProfile()
  }

  async function createProfile() {
    const username = generateUsername()
    const { data } = await supabase
      .from('profiles')
      .insert({ id: user.value.id, username })
      .select()
      .single()
    profile.value = data
  }

  return { user, profile, loading, init }
})
