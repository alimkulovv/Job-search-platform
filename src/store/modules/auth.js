import { authApi } from '@/api/axios'

export default {
  namespaced: true,
  state: () => ({
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user')),
    loading: false,
    error: null
  }),
  getters: {
    isAuthenticated: (state) => !!state.token
  },
  mutations: {
    SET_AUTH(state, payload) {
      state.token = payload.token
      state.user = payload.user
      localStorage.setItem('token', payload.token)
      localStorage.setItem('user', JSON.stringify(payload.user))
    },
    CLEAR_AUTH(state) {
      state.token = null
      state.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    SET_LOADING(state, value) { state.loading = value },
    SET_ERROR(state, error) { state.error = error }
  },
  actions: {
    async login({ commit }, credentials) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        const res = await authApi.post('/auth/login', credentials)
        commit('SET_AUTH', { token: res.data.accessToken, user: res.data })
      } catch (e) {
        commit('SET_ERROR', 'Неверный логин или пароль')
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