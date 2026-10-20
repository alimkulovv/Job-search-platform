import { createStore } from 'vuex'
import auth from './modules/auth'
import jobs from './modules/jobs'
// Подключаем модули избранного и откликов к общему хранилищу.
import favorites from './modules/favorites'
import applications from './modules/applications'

export default createStore({
  modules: { auth, jobs, favorites, applications }
})
