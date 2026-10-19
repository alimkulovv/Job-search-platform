import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'

const routes = [
  { path: '/', redirect: '/jobs' },
  { path: '/login', name: 'login', component: () => import('@/views/LoginPage.vue') },
  { path: '/jobs', name: 'jobs', component: () => import('@/views/JobsPage.vue'), meta: { requiresAuth: true } },
  { path: '/jobs/:id', name: 'job-detail', component: () => import('@/views/JobDetailPage.vue'), props: true, meta: { requiresAuth: true } },
  { path: '/favorites', name: 'favorites', component: () => import('@/views/FavoritesPage.vue'), meta: { requiresAuth: true } },
  { path: '/applications', name: 'applications', component: () => import('@/views/ApplicationsPage.vue'), meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundPage.vue') }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  const isAuth = store.getters['auth/isAuthenticated']
  if (to.meta.requiresAuth && !isAuth) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && isAuth) {
    return { name: 'jobs' }
  }
})

export default router