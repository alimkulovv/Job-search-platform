const STORAGE_KEY = 'favorites'

// Считаем число 1 и строку "1" одним ID.
function normalizedId(id) {
  return String(id)
}

// Проверяем, что у вакансии есть корректный ID.
function isValidJob(job) {
  if (!job || typeof job !== 'object' || Array.isArray(job)) {
    return false
  }
  if (typeof job.id === 'string') {
    return job.id.trim() !== ''
  }
  if (typeof job.id === 'number') {
    return Number.isFinite(job.id)
  }
  return false
}

// Восстанавливаем избранное из памяти браузера.
function loadFavorites() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === null) {
      return { list: [], error: null }
    }

    // Превращаем сохранённую JSON-строку обратно в массив.
    const savedJobs = JSON.parse(saved)
    if (!Array.isArray(savedJobs)) {
      throw new Error('Invalid saved favorites')
    }

    // Убираем повторяющиеся вакансии с одинаковым ID.
    const uniqueJobs = []
    for (const job of savedJobs) {
      if (!isValidJob(job)) {
        throw new Error('Invalid saved favorites')
      }
      const alreadySaved = uniqueJobs.some(savedJob => normalizedId(savedJob.id) === normalizedId(job.id))
      if (!alreadySaved) {
        uniqueJobs.push(job)
      }
    }
    return { list: uniqueJobs, error: null }
  } catch {
    // Ошибка чтения не должна ломать страницу.
    return {
      list: [],
      error: 'Не удалось прочитать избранное из браузера. Можно добавлять вакансии заново.'
    }
  }
}

// Сохраняем список, чтобы он остался после обновления страницы.
function saveFavorites(list, commit) {
  try {
    // localStorage хранит строки, поэтому используем JSON.stringify.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    commit('SET_ERROR', null)
  } catch {
    // Сообщаем об ошибке, сохраняя текущий список в Vuex.
    commit('SET_ERROR', 'Избранное изменено, но не сохранено в браузере. После обновления изменения могут пропасть.')
  }
}

export default {
  // Обращаемся к этому модулю через префикс favorites/.
  namespaced: true,
  // state хранит список вакансий и сообщение об ошибке.
  state() {
    return loadFavorites()
  },
  // Getter проверяет, добавлена ли вакансия в избранное.
  getters: {
    isFavorite(state) {
      return (id) => {
        return state.list.some(job => normalizedId(job.id) === normalizedId(id))
      }
    }
  },
  // Только mutations изменяют данные в state.
  mutations: {
    SET_LIST(state, list) { state.list = list },
    SET_ERROR(state, error) { state.error = error }
  },
  // Actions вызывают mutations и сохраняют результат в браузере.
  actions: {
    toggleFavorite({ state, getters, commit }, job) {
      if (!isValidJob(job)) {
        commit('SET_ERROR', 'Не удалось добавить вакансию: отсутствует корректный ID.')
        return
      }

      // Повторный клик удаляет вакансию, первый клик добавляет её.
      let updatedJobs
      if (getters.isFavorite(job.id)) {
        updatedJobs = state.list.filter(savedJob => normalizedId(savedJob.id) !== normalizedId(job.id))
      } else {
        // Копируем список и вакансию, чтобы не менять исходные объекты.
        updatedJobs = state.list.slice()
        updatedJobs.push({ ...job })
      }

      commit('SET_LIST', updatedJobs)
      saveFavorites(updatedJobs, commit)
    },
    // Удаляем вакансию по ID и сохраняем обновлённый список.
    removeFavorite({ state, commit }, id) {
      const list = state.list.filter(job => normalizedId(job.id) !== normalizedId(id))
      commit('SET_LIST', list)
      saveFavorites(list, commit)
    }
  }
}
