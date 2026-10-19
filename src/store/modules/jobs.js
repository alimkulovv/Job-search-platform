import { jobsApi } from '@/api/axios'

export default {
  namespaced: true,
  state: () => ({
    list: [],
    job: null,
    loading: false,
    error: null
  }),
  mutations: {
    SET_LIST(state, list) { state.list = list },
    SET_JOB(state, job) { state.job = job },
    SET_LOADING(state, v) { state.loading = v },
    SET_ERROR(state, e) { state.error = e }
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
    async fetchJobById({ commit }, id) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        const res = await jobsApi.get('/Jobs/' + id)
        commit('SET_JOB', res.data)
      } catch (e) {
        commit('SET_ERROR', 'Вакансия не найдена')
      } finally {
        commit('SET_LOADING', false)
      }
    }
  }
}