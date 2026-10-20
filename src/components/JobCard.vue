<template>
  <article class="card job-card">
    <div class="job-card-heading">
      <h3>{{ job.title }}</h3>
      <!-- Передаём состояние сердечка и обрабатываем событие toggle. -->
      <FavoriteButton :active="isFavorite" @toggle="toggleFavorite" />
    </div>
    <p>{{ job.company }} · {{ job.location }}</p>
    <p>{{ job.type }} · {{ job.salary }} ₸</p>
    <button type="button" @click="$emit('open', job.id)">Подробнее</button>
  </article>
</template>

<script>
import FavoriteButton from '@/components/FavoriteButton.vue'

export default {
  components: { FavoriteButton },
  // Получаем объект вакансии от родительской страницы.
  props: { job: { type: Object, required: true } },
  // Событие open передаёт родителю ID выбранной вакансии.
  emits: ['open'],
  // Getter определяет, нужно ли закрасить сердечко.
  computed: {
    isFavorite() { return this.$store.getters['favorites/isFavorite'](this.job.id) }
  },
  methods: {
    // Просим Vuex добавить или удалить эту вакансию.
    toggleFavorite() { this.$store.dispatch('favorites/toggleFavorite', this.job) }
  }
}
</script>

<style scoped>
.job-card { margin-bottom: 16px; }
.job-card-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.job-card-heading h3 { overflow-wrap: anywhere; }
</style>
