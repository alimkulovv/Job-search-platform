<template>
  <header class="header">
    <RouterLink to="/jobs" class="logo">
      <span class="logo-badge">JF</span>
      <span class="logo-text">Job<b>Finder</b></span>
    </RouterLink>

    <nav v-if="isAuth">
      <RouterLink to="/jobs">Вакансии</RouterLink>
      <RouterLink to="/favorites">Избранное</RouterLink>
      <RouterLink to="/applications">Мои отклики</RouterLink>
    </nav>

    <div class="user" v-if="isAuth">
      <span>👤 {{ userName }}</span>
      <button @click="logout">Выйти</button>
    </div>
    <RouterLink v-else to="/login" class="user">Войти</RouterLink>
  </header>
</template>

<script>
export default {
  computed: {
    isAuth() {
      return this.$store.getters['auth/isAuthenticated']
    },
    userName() {
      const user = this.$store.state.auth.user
      return user ? user.firstName : ''
    }
  },
  methods: {
    logout() {
      this.$store.dispatch('auth/logout')
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 14px 32px;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
}
.logo { display: flex; align-items: center; gap: 10px; color: #fff; text-decoration: none; }
.logo-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%);
  color: #4f46e5;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -1px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
  transform: rotate(-6deg);
  transition: transform .2s;
}
.logo:hover .logo-badge { transform: rotate(0deg) scale(1.08); }
.logo-text { font-size: 20px; font-weight: 400; letter-spacing: .3px; }
.logo-text b { font-weight: 800; }
nav { display: flex; gap: 20px; }
nav a { color: rgba(255, 255, 255, 0.8); font-weight: 500; padding-bottom: 2px; }
nav a:hover { color: #fff; }
nav a.router-link-active { color: #fff; border-bottom: 2px solid #fff; }
.user { margin-left: auto; display: flex; align-items: center; gap: 12px; color: #fff; }
.user button { background: rgba(255, 255, 255, 0.2); padding: 6px 14px; }
.user button:hover { background: rgba(255, 255, 255, 0.35); }
/* На узком экране переносим навигацию ниже логотипа. */
@media (max-width: 700px) {
  .header { flex-wrap: wrap; gap: 14px; padding: 14px 16px; }
  nav { order: 3; width: 100%; gap: 16px; flex-wrap: wrap; }
  .user { gap: 8px; }
  .user span { max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}
</style>
