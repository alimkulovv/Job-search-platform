import { applicationsApi } from '@/api/axios'

// Адрес ресурса можно изменить в .env без правки модуля.
const resource = import.meta.env.VITE_APPLICATIONS_RESOURCE || '/applications'
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getCurrentUserId(rootState) {
  const user = rootState.auth.user
  if (!user) {
    return null
  }
  return user.id
}

// Старый запрос может менять данные только до выхода или смены аккаунта.
function isCurrentSession(state, rootState, userId, version) {
  if (state.sessionVersion !== version) {
    return false
  }
  const currentUserId = getCurrentUserId(rootState)
  return String(currentUserId) === String(userId)
}

function trimText(value) {
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim()
}

// Превращаем техническую ошибку запроса в понятное сообщение.
function errorMessage(error, operation) {
  if (error.response) {
    if (error.response.status === 404) {
      return 'Ресурс откликов не найден. Создайте ресурс applications в MockAPI и проверьте адрес API в .env.'
    }
    if (error.response.status === 429) {
      return 'Слишком много запросов. Подождите немного и попробуйте ещё раз.'
    }
  }
  if (error.code === 'ECONNABORTED') {
    return 'Сервер не ответил вовремя. Попробуйте ещё раз.'
  }
  if (error.response) {
    return `${operation} (ошибка сервера ${error.response.status}). Попробуйте ещё раз.`
  }
  if (error.request) {
    return 'Нет ответа от сервера. Проверьте подключение к интернету и адрес API.'
  }
  return error.message || operation
}

export default {
  // Обращаемся к модулю через префикс applications/.
  namespaced: true,
  state() {
    return {
      list: [],
      // loading относится к GET, а submitting — к POST.
      loading: false,
      submitting: false,
      error: null,
      submitError: null,
      // Номер сессии меняется при сбросе и защищает от старых ответов.
      sessionVersion: 0
    }
  },
  getters: {
    // Показываем только отклики текущего пользователя, начиная с новых.
    userApplications(state, getters, rootState) {
      const userId = getCurrentUserId(rootState)
      if (userId == null) {
        return []
      }
      const ownApplications = state.list.filter(function (application) {
        return String(application.userId) === String(userId)
      })
      ownApplications.sort(function (first, second) {
        const firstDate = Date.parse(first.createdAt) || 0
        const secondDate = Date.parse(second.createdAt) || 0
        return secondDate - firstDate
      })
      return ownApplications
    }
  },
  // Мутации синхронно изменяют данные хранилища через commit.
  mutations: {
    SET_LIST(state, list) {
      state.list = list
    },
    ADD_APPLICATION(state, application) {
      const otherApplications = state.list.filter(function (item) {
        return String(item.id) !== String(application.id)
      })
      otherApplications.unshift(application)
      state.list = otherApplications
    },
    SET_LOADING(state, value) {
      state.loading = value
    },
    SET_SUBMITTING(state, value) {
      state.submitting = value
    },
    SET_ERROR(state, value) {
      state.error = value
    },
    SET_SUBMIT_ERROR(state, value) {
      state.submitError = value
    },
    // При смене аккаунта очищаем данные и делаем старые запросы неактуальными.
    RESET(state) {
      state.list = []
      state.loading = false
      state.submitting = false
      state.error = null
      state.submitError = null
      state.sessionVersion += 1
    }
  },
  // Actions вызываются через dispatch и могут ждать ответа сервера.
  actions: {
    reset({ commit }) {
      commit('RESET')
    },
    clearSubmitError({ commit }) {
      commit('SET_SUBMIT_ERROR', null)
    },
    async fetchApplications({ state, commit, rootState }) {
      // Пока список загружается, второй GET не запускаем.
      if (state.loading) {
        return
      }
      const userId = getCurrentUserId(rootState)
      if (userId == null) {
        commit('RESET')
        commit('SET_ERROR', 'Войдите в аккаунт, чтобы посмотреть свои отклики.')
        return
      }
      const version = state.sessionVersion
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      commit('SET_LIST', [])
      try {
        // GET получает отклики с фильтром userId, а await ждёт ответ.
        const response = await applicationsApi.get(resource, {
          params: { userId: userId }
        })
        if (!Array.isArray(response.data)) {
          throw new Error('Сервер вернул неверный формат откликов: ожидался массив.')
        }
        // MockAPI может фильтровать по частичному совпадению: проверяем владельца точно.
        const ownApplications = response.data.filter(function (item) {
          if (!item) {
            return false
          }
          return String(item.userId) === String(userId)
        })
        if (isCurrentSession(state, rootState, userId, version)) {
          commit('SET_LIST', ownApplications)
        }
      } catch (error) {
        if (isCurrentSession(state, rootState, userId, version)) {
          commit('SET_ERROR', errorMessage(error, 'Не удалось загрузить отклики'))
        }
      } finally {
        // Убираем загрузку после успеха или ошибки, не затрагивая новую сессию.
        if (isCurrentSession(state, rootState, userId, version)) {
          commit('SET_LOADING', false)
        }
      }
    },
    async submitApplication({ state, commit, rootState }, form) {
      // Защищаемся от повторной отправки, пока POST ещё выполняется.
      if (state.submitting) {
        throw new Error('Дождитесь завершения отправки отклика.')
      }
      commit('SET_SUBMIT_ERROR', null)
      const userId = getCurrentUserId(rootState)
      const formData = form || {}
      const job = formData.job
      // Убираем пробелы по краям и не принимаем значения других типов.
      const name = trimText(formData.name)
      const email = trimText(formData.email)
      const letter = trimText(formData.letter)
      let validationError = null
      // Повторно проверяем данные в action, даже если форма уже проверила их.
      if (userId == null) {
        validationError = 'Войдите в аккаунт, чтобы отправить отклик.'
      } else if (!job || job.id == null || String(job.id).trim() === '') {
        validationError = 'Не удалось определить вакансию.'
      } else if (name.length < 2 || name.length > 100) {
        validationError = 'Имя должно содержать от 2 до 100 символов.'
      } else if (!emailPattern.test(email) || email.length > 254) {
        validationError = 'Укажите корректный email.'
      } else if (letter.length < 20 || letter.length > 5000) {
        validationError = 'Письмо должно содержать от 20 до 5000 символов.'
      }
      if (validationError) {
        commit('SET_SUBMIT_ERROR', validationError)
        throw new Error(validationError)
      }
      // Формируем объект отклика с владельцем, вакансией и датой отправки.
      const payload = {
        userId: userId,
        jobId: job.id,
        jobTitle: job.title || 'Вакансия',
        company: job.company || '',
        name: name,
        email: email,
        letter: letter,
        status: 'submitted',
        createdAt: new Date().toISOString()
      }
      const version = state.sessionVersion
      commit('SET_SUBMITTING', true)
      try {
        // POST сохраняет отклик на сервере, а не только в памяти браузера.
        const response = await applicationsApi.post(resource, payload)
        const saved = response.data
        // Наличие id подтверждает сохранение перед добавлением отклика в список.
        if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {
          throw new Error('Сервер не подтвердил сохранение отклика: в ответе отсутствует id.')
        }
        if (saved.id == null || String(saved.id).trim() === '') {
          throw new Error('Сервер не подтвердил сохранение отклика: в ответе отсутствует id.')
        }
        // Копируем ответ сервера и проверенные поля формы в новый объект.
        const application = Object.assign({}, saved, payload)
        application.id = saved.id
        if (isCurrentSession(state, rootState, userId, version)) {
          commit('ADD_APPLICATION', application)
        }
        return application
      } catch (error) {
        if (isCurrentSession(state, rootState, userId, version)) {
          commit('SET_SUBMIT_ERROR', errorMessage(error, 'Не удалось отправить отклик'))
        }
        throw error
      } finally {
        // Возвращаем кнопку в обычное состояние при любом исходе запроса.
        if (isCurrentSession(state, rootState, userId, version)) {
          commit('SET_SUBMITTING', false)
        }
      }
    }
  }
}
