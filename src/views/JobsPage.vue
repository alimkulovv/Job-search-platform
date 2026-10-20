<template>
  <div>
    <h1>Вакансии</h1>
    <!-- Сообщаем, если избранное не удалось сохранить в браузере. -->
    <p v-if="favoritesError" class="error" role="alert">{{ favoritesError }}</p>
    <input v-model="search" placeholder="Поиск по названию" />
    <select v-model="type">
      <option value="">Все типы</option>
      <option value="full-time">full-time</option>
      <option value="part-time">part-time</option>
      <option value="remote">remote</option>
      <option value="internship">internship</option>
    </select>

    <p v-if="loading">Загрузка...</p>
    <p v-else-if="error">{{ error }}</p>
    <p v-else-if="filtered.length === 0">Ничего не найдено</p>
    <div v-else>
      <JobCard v-for="job in filtered" :key="job.id" :job="job" @open="openJob" />
    </div>
  </div>
</template>

<script>
import JobCard from '@/components/JobCard.vue'

export default {
  components: { JobCard },
  data() {
    return { search: '', type: '' }
  },
  computed: {
    loading() { return this.$store.state.jobs.loading },
    error() { return this.$store.state.jobs.error },
    favoritesError() { return this.$store.state.favorites.error },
    filtered() {
      return this.$store.state.jobs.list.filter(j =>
        j.title.toLowerCase().includes(this.search.toLowerCase()) &&
        (this.type === '' || j.type === this.type)
      )
    }
  },
  watch: {
    type(newVal) { console.log('Фильтр изменён:', newVal) }
  },
  mounted() {
    this.$store.dispatch('jobs/fetchJobs')
  },
  methods: {
    openJob(id) { this.$router.push('/jobs/' + id) }
  }
}
</script>
