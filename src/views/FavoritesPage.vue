<template>
  <section aria-labelledby="favorites-heading">
    <h1 id="favorites-heading">Избранные вакансии</h1>
    <p class="intro">Сохраняйте интересные предложения, чтобы вернуться к ним позже.</p>

    <!-- Показываем ошибку сохранения или чтения избранного. -->
    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <!-- Если список пуст, объясняем, как добавить вакансии. -->
    <div v-if="favorites.length === 0" class="card empty-state">
      <h3>Пока нет избранных вакансий</h3>
      <p>Нажмите на сердечко в карточке вакансии, чтобы сохранить её здесь.</p>
      <RouterLink to="/jobs">Перейти к вакансиям →</RouterLink>
    </div>
    <div v-else>
      <p class="count">Сохранено вакансий: {{ favorites.length }}</p>
      <!-- Создаём карточку для каждой сохранённой вакансии. -->
      <JobCard
        v-for="job in favorites"
        :key="job.id"
        :job="job"
        @open="openJob"
      />
    </div>
  </section>
</template>

<script>
import JobCard from '@/components/JobCard.vue'

export default {
  components: { JobCard },
  // Берём актуальный список и ошибку из Vuex.
  computed: {
    favorites() { return this.$store.state.favorites.list },
    error() { return this.$store.state.favorites.error }
  },
  methods: {
    // Открываем страницу выбранной вакансии через Vue Router.
    openJob(id) { this.$router.push('/jobs/' + encodeURIComponent(id)) }
  }
}
</script>

<style scoped>
.intro, .count { color: var(--muted); }
.intro { margin: -6px 0 24px; }
.empty-state { margin-top: 20px; padding: 30px; }
.empty-state a { display: inline-block; margin-top: 16px; font-weight: 600; }
</style>
