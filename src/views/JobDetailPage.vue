<template>
  <section class="job-detail">
    <RouterLink to="/jobs">← К вакансиям</RouterLink>
    <!-- Во время запроса показываем загрузку, при сбое — ошибку и повтор. -->
    <p v-if="loading" class="loader" role="status">Загрузка вакансии...</p>
    <div v-else-if="error" class="error" role="alert">
      <p>{{ error }}</p>
      <button type="button" @click="loadJob">Попробовать снова</button>
    </div>
    <template v-else-if="job">
      <article class="card job-description">
        <div class="job-heading">
          <div>
            <p class="eyebrow">{{ job.company }}</p>
            <h1>{{ job.title }}</h1>
          </div>
          <!-- Передаём состояние сердечка и принимаем событие нажатия. -->
          <FavoriteButton :active="isFavorite" @toggle="toggleFavorite" />
        </div>
        <p>{{ job.location }} · {{ job.type }}</p>
        <p v-if="job.salary">{{ Number(job.salary).toLocaleString('ru-RU') }} ₸</p>
        <h2>Описание вакансии</h2>
        <p class="description">{{ job.description || 'Работодатель пока не добавил описание.' }}</p>
        <p v-if="favoritesError" class="error" role="alert">{{ favoritesError }}</p>
      </article>
      <!-- key создаёт новую форму при переходе на другую вакансию. -->
      <ApplyForm :key="job.id" :job="job" />
    </template>
  </section>
</template>

<script>
import FavoriteButton from '@/components/FavoriteButton.vue'
import ApplyForm from '@/components/ApplyForm.vue'

export default {
  components: { FavoriteButton, ApplyForm },
  computed: {
    // Берём состояние загрузки и ошибку из модуля вакансий.
    loading() {
      return this.$store.state.jobs.loading
    },
    error() {
      return this.$store.state.jobs.error
    },
    job() {
      const job = this.$store.state.jobs.job
      // Данные должны относиться к вакансии из текущего адреса страницы.
      if (!job || String(job.id) !== String(this.$route.params.id)) {
        return null
      }
      return job
    },
    isFavorite() {
      if (!this.job) return false
      return this.$store.getters['favorites/isFavorite'](this.job.id)
    },
    favoritesError() {
      return this.$store.state.favorites.error
    }
  },
  watch: {
    // Загружаем вакансию сразу и при изменении её ID в адресе.
    '$route.params.id': {
      immediate: true,
      handler() {
        this.loadJob()
      }
    }
  },
  methods: {
    loadJob() {
      this.$store.dispatch('jobs/fetchJobById', this.$route.params.id)
    },
    // Передаём текущую вакансию в модуль избранного.
    toggleFavorite() {
      this.$store.dispatch('favorites/toggleFavorite', this.job)
    }
  }
}
</script>

<style scoped>
.job-detail { display: grid; gap: 22px; }
.job-description:hover { transform: none; }
.job-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.job-heading h1 { margin: 4px 0 14px; overflow-wrap: anywhere; }
.eyebrow { font-weight: 600; color: var(--primary); }
.description { white-space: pre-line; overflow-wrap: anywhere; }
h2 { font-size: 20px; margin: 24px 0 8px; }
</style>
