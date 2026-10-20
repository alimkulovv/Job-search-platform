<template>
  <section class="applications-page">
    <div class="page-top">
      <div>
        <p class="eyebrow">ВАШ КАРЬЕРНЫЙ ПУТЬ</p>
        <h1>Мои отклики <span v-if="applications.length" class="count">{{ applications.length }}</span></h1>
        <p class="subtitle">Все отправленные заявки — в одном месте.</p>
      </div>
      <RouterLink class="browse-link" to="/jobs">Найти вакансию <span aria-hidden="true">↗</span></RouterLink>
    </div>
    <!-- Цепочка v-if выбирает одно состояние: загрузку, ошибку, пустой список или отклики. -->
    <div v-if="loading" class="state-panel" role="status">
      <span class="loading-dot" aria-hidden="true"></span><h2>Загружаем ваши отклики…</h2><p>Получаем актуальные данные с сервера.</p>
    </div>
    <!-- При ошибке кнопка повторяет GET-запрос. -->
    <div v-else-if="error" class="state-panel" role="alert">
      <h2>Не удалось загрузить отклики</h2><p>{{ error }}</p><button class="primary-button" @click="loadApplications">Попробовать ещё раз</button>
    </div>
    <!-- Пустой список появляется только после загрузки без ошибки. -->
    <div v-else-if="!applications.length" class="state-panel empty-panel">
      <span class="empty-icon" aria-hidden="true">↗</span><h2>Первый шаг к новой работе</h2>
      <p>Пока у вас нет откликов. Выберите подходящую вакансию и отправьте сопроводительное письмо.</p>
      <RouterLink class="primary-button" to="/jobs">Смотреть вакансии →</RouterLink>
    </div>
    <div v-else class="application-list">
      <!-- v-for создаёт карточки, а :key помогает Vue различать отклики по id. -->
      <article v-for="application in applications" :key="application.id" class="application-card">
        <div class="card-top">
          <div class="job-heading">
            <div class="company-icon" aria-hidden="true">{{ companyInitial(application.company) }}</div>
            <div><p class="company-name">{{ application.company || 'Компания не указана' }}</p>
              <h2><RouterLink :to="{ name: 'job-detail', params: { id: application.jobId } }">{{ application.jobTitle || 'Вакансия' }}</RouterLink></h2>
            </div>
          </div>
          <span class="status-badge"><span aria-hidden="true">●</span> {{ statusLabel(application.status) }}</span>
        </div>
        <div class="application-meta">
          <span>Отправлен: <time :datetime="application.createdAt">{{ formatDate(application.createdAt) }}</time></span>
          <span>{{ application.name }} · {{ application.email }}</span>
        </div>
        <div class="letter"><h3>Сопроводительное письмо</h3><p>{{ application.letter }}</p></div>
        <!-- RouterLink открывает соответствующую вакансию без перезагрузки страницы. -->
        <RouterLink class="details-link" :to="{ name: 'job-detail', params: { id: application.jobId } }">Открыть вакансию <span aria-hidden="true">→</span></RouterLink>
      </article>
    </div>
  </section>
</template>

<script>
export default {
  // Получаем состояния запроса и отклики только текущего пользователя из Vuex.
  computed: {
    loading() {
      return this.$store.state.applications.loading
    },
    error() {
      return this.$store.state.applications.error
    },
    applications() {
      return this.$store.getters['applications/userApplications']
    },
    userId() {
      const user = this.$store.state.auth.user
      if (!user) {
        return undefined
      }
      return user.id
    }
  },
  // При смене аккаунта запрашиваем отклики нового пользователя.
  watch: {
    userId() {
      this.loadApplications()
    }
  },
  // После появления страницы сразу загружаем список с сервера.
  mounted() {
    this.loadApplications()
  },
  methods: {
    // dispatch передаёт загрузку action модуля applications.
    loadApplications() {
      return this.$store.dispatch('applications/fetchApplications')
    },
    companyInitial(company) {
      const companyName = company || 'J'
      return companyName.trim().charAt(0).toUpperCase()
    },
    // Превращаем серверную дату в привычную русскую запись.
    formatDate(value) {
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) {
        return 'Дата не указана'
      }
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    },
    // Переводим технический статус отклика в понятную подпись.
    statusLabel(status) {
      const labels = {
        submitted: 'Отправлен',
        pending: 'На рассмотрении',
        reviewed: 'Рассмотрен',
        accepted: 'Принят',
        rejected: 'Отклонён'
      }
      if (labels[status]) {
        return labels[status]
      }
      if (status) {
        return status
      }
      return 'Отправлен'
    }
  }
}
</script>

<style scoped>
.applications-page { max-width: 1050px; margin: 0 auto; padding: 38px 0 60px; }
.page-top { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 30px; }
.eyebrow { color: #8662cb; font-size: 11px; font-weight: 800; letter-spacing: .14em; margin: 0 0 12px; }
h1 { color: #29213f; font-size: 31px; letter-spacing: -.8px; margin: 0; display: flex; align-items: center; gap: 13px; }
.count { font-size: 13px; letter-spacing: 0; border: 1px solid #e3d9f4; border-radius: 8px; color: #8055c7; background: #f1ebfb; padding: 5px 9px; }
.subtitle { color: #888195; font-size: 14px; margin: 12px 0 0; }
.browse-link { color: #7450be; font-size: 13px; font-weight: 600; text-decoration: none; white-space: nowrap; border: 1px solid #dfd4ef; padding: 12px 16px; border-radius: 9px; background: #fff; }
.browse-link span { margin-left: 12px; }
.application-list { display: grid; gap: 20px; }
.application-card { background: #fff; border: 1px solid #e8e3ef; border-radius: 16px; padding: 26px 28px; }
.card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.job-heading { display: flex; gap: 15px; align-items: center; min-width: 0; }
.company-icon { width: 46px; height: 46px; flex-shrink: 0; display: grid; place-items: center; border: 1px solid #e8def7; border-radius: 12px; background: #f4effb; font-size: 20px; font-weight: 800; color: #8761ca; }
.company-name { color: #82768f; font-size: 12px; margin: 0 0 7px; overflow-wrap: anywhere; }
.application-card h2 { font-size: 19px; line-height: 1.4; margin: 0; overflow-wrap: anywhere; }
.application-card h2 a { color: #352a49; text-decoration: none; }
.application-card h2 a:hover { color: #7952cc; }
.status-badge { background: #edf8f1; color: #408762; font-size: 11px; line-height: 1.5; padding: 6px 11px; border-radius: 6px; white-space: nowrap; }
.status-badge span { font-size: 8px; margin-right: 5px; }
.application-meta { display: flex; flex-wrap: wrap; gap: 8px 25px; margin: 23px 0 0; font-size: 12px; color: #8b8296; line-height: 1.6; overflow-wrap: anywhere; }
.letter { background: #faf9fc; border: 1px solid #f0edf5; border-radius: 10px; padding: 17px 18px; margin-top: 18px; }
.letter h3 { color: #5d526e; font-size: 12px; margin: 0 0 9px; font-weight: 600; }
.letter p { color: #847a90; line-height: 1.8; font-size: 13px; margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.details-link { display: inline-flex; gap: 24px; color: #8058c8; font-size: 12px; font-weight: 600; text-decoration: none; margin-top: 19px; }
.state-panel { text-align: center; padding: 65px 25px; background: #fff; border: 1px solid #e8e3ef; border-radius: 16px; }
.state-panel h2 { font-size: 22px; color: #3d3153; margin: 18px 0 12px; }
.state-panel p { font-size: 14px; line-height: 1.8; color: #8b8197; max-width: 470px; margin: 0 auto 24px; overflow-wrap: anywhere; }
.empty-icon { display: inline-grid; place-items: center; width: 64px; height: 64px; border-radius: 18px; background: #f0e9fb; color: #9b79d1; font-size: 32px; }
.primary-button { display: inline-block; color: #fff; background: #8059ca; border: 0; border-radius: 9px; padding: 13px 20px; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: none; }
.primary-button:hover { background: #6b45b5; }
.loading-dot { display: inline-block; width: 24px; height: 24px; border: 3px solid #e8dff5; border-top-color: #8059ca; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .loading-dot { animation: none; } }
@media (max-width: 600px) { .applications-page { padding-top: 25px; } .page-top { align-items: flex-start; flex-direction: column; } h1 { font-size: 27px; } .application-card { padding: 20px 18px; } .card-top { flex-direction: column; } .application-card h2 { font-size: 18px; } .status-badge { margin-left: 61px; } }
</style>
