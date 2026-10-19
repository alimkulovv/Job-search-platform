<!-- LoginPage.vue -->
<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import AppError from '@/components/AppError.vue'

const store = useStore()
const router = useRouter()
const route = useRoute()

const username = ref('emilys')
const password = ref('emilyspass')
const loading = computed(() => store.state.auth.loading)
const error = computed(() => store.state.auth.error)

async function submit() {
  try {
    await store.dispatch('auth/login', { username: username.value, password: password.value })
    router.push(route.query.redirect || '/jobs')
  } catch { /* ошибка уже в сторе */ }
}
</script>

<template>
  <div class="login">
    <h1>Вход</h1>
    <input v-model="username" placeholder="Логин" />
    <input v-model="password" type="password" placeholder="Пароль" />
    <button :disabled="loading" @click="submit">{{ loading ? 'Входим...' : 'Войти' }}</button>
    <AppError v-if="error" :message="error" />
  </div>
</template>