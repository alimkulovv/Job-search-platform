import { createStore } from 'vuex'
import auth from './modules/auth'

export default createStore({
  modules: { auth }
  // №2 добавит jobs, №3 добавит favorites и applications
})