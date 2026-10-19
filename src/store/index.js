import { createStore } from 'vuex'
import auth from './modules/auth'
import jobs from './modules/jobs'

export default createStore({
  modules: { auth, jobs }
})