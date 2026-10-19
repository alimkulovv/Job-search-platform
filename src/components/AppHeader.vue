<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()
const isAuth = computed(() => store.getters['auth/isAuthenticated'])
const user = computed(() => store.state.auth.user)

function logout() {
  store.dispatch('auth/logout')
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="header">
    <RouterLink to="/jobs" class="logo">💼 JobFinder</RouterLink>
    <nav v-if="isAuth">
      <RouterLink to="/jobs">Вакансии</RouterLink>
      <RouterLink to="/favorites">Избранное</RouterLink>
      <RouterLink to="/applications">Мои отклики</RouterLink>
    </nav>
    <div class="user" v-if="isAuth">
      <span>👤 {{ user?.firstName }}</span>
      <button @click="logout">Выйти</button>
    </div>
    <RouterLink v-else to="/login" class="user">Войти</RouterLink>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 14px 32px;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
}
.logo { color: #fff; font-size: 20px; font-weight: 700; }
nav { display: flex; gap: 20px; }
nav a { color: rgba(255, 255, 255, 0.8); font-weight: 500; padding-bottom: 2px; }
nav a:hover { color: #fff; }
nav a.router-link-active { color: #fff; border-bottom: 2px solid #fff; }
.user { margin-left: auto; display: flex; align-items: center; gap: 12px; color: #fff; }
.user button { background: rgba(255, 255, 255, 0.2); padding: 6px 14px; }
.user button:hover { background: rgba(255, 255, 255, 0.35); }
</style>