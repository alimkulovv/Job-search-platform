import { jobsApi } from '@/api/axios'

export default {
  namespaced: true,
  state: () => ({
    list: [],
    job: null,
    loading: false,
    error: null,
    // Номер последнего запроса отдельной вакансии.
    jobRequestId: 0
  }),
  mutations: {
    SET_LIST(state, list) { state.list = list },
    SET_JOB(state, job) { state.job = job },
    SET_LOADING(state, v) { state.loading = v },
    SET_ERROR(state, e) { state.error = e },
    // Новый номер позволяет отличить свежий запрос от предыдущих.
    START_JOB_REQUEST(state) { state.jobRequestId += 1 }
  },
  actions: {
    async fetchJobs({ commit }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        const res = await jobsApi.get('/Jobs')
        commit('SET_LIST', res.data)
      } catch (e) {
        commit('SET_ERROR', 'Не удалось загрузить вакансии')
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async fetchJobById({ commit, state }, id) {
      commit('START_JOB_REQUEST')
      const requestId = state.jobRequestId
      // Убираем предыдущую вакансию, пока загружается новая.
      commit('SET_JOB', null)
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        const res = await jobsApi.get('/Jobs/' + encodeURIComponent(id))
        // Показываем ответ только последнего запроса.
        if (requestId === state.jobRequestId) commit('SET_JOB', res.data)
      } catch (e) {
        if (requestId === state.jobRequestId) {
          if (e.response && e.response.status === 404) {
            commit('SET_ERROR', 'Вакансия не найдена')
          } else {
            commit('SET_ERROR', 'Не удалось загрузить вакансию. Попробуйте ещё раз.')
          }
        }
      } finally {
        // Старый запрос не должен выключать загрузку нового.
        if (requestId === state.jobRequestId) commit('SET_LOADING', false)
      }
    }
  }
}
