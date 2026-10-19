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
    <RouterLink to="/jobs">Вакансии</RouterLink>
    <template v-if="isAuth">
      <RouterLink to="/favorites">Избранное</RouterLink>
      <RouterLink to="/applications">Мои отклики</RouterLink>
      <span>{{ user?.firstName }}</span>
      <button @click="logout">Выйти</button>
    </template>
    <RouterLink v-else to="/login">Войти</RouterLink>
  </header>
</template>

<style scoped>
.header { display: flex; gap: 16px; align-items: center; padding: 12px 24px; border-bottom: 1px solid #ddd; }
</style>