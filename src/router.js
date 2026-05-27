import { createRouter, createWebHistory } from 'vue-router'
import Home     from '@/views/Home.vue'
import Queue    from '@/views/Queue.vue'
import Story    from '@/views/Story.vue'
import Complete from '@/views/Complete.vue'
import Library  from '@/views/Library.vue'
import Feed     from '@/views/Feed.vue'

const routes = [
  { path: '/',         component: Home },
  { path: '/queue',    component: Queue },
  { path: '/story',    component: Story },
  { path: '/complete', component: Complete },
  { path: '/library',  component: Library },
  { path: '/feed',     component: Feed },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
