import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'

import LoginPage from '@/views/LoginPage.vue'
import JobsPage from '@/views/JobsPage.vue'
import JobDetailPage from '@/views/JobDetailPage.vue'
import FavoritesPage from '@/views/FavoritesPage.vue'
import ApplicationsPage from '@/views/ApplicationsPage.vue'
import NotFoundPage from '@/views/NotFoundPage.vue'

const routes = [
  { path: '/', redirect: '/jobs' },
  { path: '/login', name: 'login', component: LoginPage },
  { path: '/jobs', name: 'jobs', component: JobsPage, meta: { requiresAuth: true } },
  { path: '/jobs/:id', name: 'job-detail', component: JobDetailPage, meta: { requiresAuth: true } },
  { path: '/favorites', name: 'favorites', component: FavoritesPage, meta: { requiresAuth: true } },
  { path: '/applications', name: 'applications', component: ApplicationsPage, meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundPage }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

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