<template>
  <div class="login card">
    <h1>Вход</h1>
    <form @submit.prevent="submit">
      <input v-model="username" placeholder="Логин" />
      <input v-model="password" type="password" placeholder="Пароль" />
      <p v-if="formError" class="error">{{ formError }}</p>
      <p v-if="serverError" class="error">{{ serverError }}</p>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Входим...' : 'Войти' }}
      </button>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: 'emilys',
      password: 'emilyspass',
      formError: ''
    }
  },
  computed: {
    loading() { return this.$store.state.auth.loading },
    serverError() { return this.$store.state.auth.error }
  },
  methods: {
    async submit() {
      this.formError = ''
      if (!this.username || !this.password) {
        this.formError = 'Введите логин и пароль'
        return
      }
      try {
        await this.$store.dispatch('auth/login', {
          username: this.username,
          password: this.password
        })
        this.$router.push(this.$route.query.redirect || '/jobs')
      } catch (e) {
        // ошибка уже записана в сторе
      }
    }
  }
}
</script>