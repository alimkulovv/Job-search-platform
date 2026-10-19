import { authApi } from '@/api/axios'

export default {
  namespaced: true,
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    loading: false,
    error: null
  }),
  getters: {
    isAuthenticated: (s) => !!s.token
  },
  mutations: {
    SET_AUTH(state, { token, user }) {
      state.token = token
      state.user = user
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    },
    CLEAR_AUTH(state) {
      state.token = null
      state.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    SET_LOADING(state, v) { state.loading = v },
    SET_ERROR(state, e) { state.error = e }
  },
  actions: {
    async login({ commit }, { username, password }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        const { data } = await authApi.post('/auth/login', { username, password })
        commit('SET_AUTH', { token: data.accessToken || data.token, user: data })
      } catch (e) {
        commit('SET_ERROR', e.response?.data?.message || 'Ошибка входа')
        throw e
      } finally {
        commit('SET_LOADING', false)
      }
    },
    logout({ commit }) {
      commit('CLEAR_AUTH')
    }
  }
}