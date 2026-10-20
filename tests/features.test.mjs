import { after, before, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import vuePlugin from '@vitejs/plugin-vue'
import { createStore } from 'vuex'
import { AxiosError } from 'axios'

let server
let favorites
let applications
let applicationsApi
let ApplyForm
let storage
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')

before(async () => {
  // Vite загружает модули с теми же @ и import.meta.env, что и приложение.
  // HTTP-сервер и запросы к настоящему API для этих тестов не нужны.
  server = await createServer({
    configFile: false,
    plugins: [vuePlugin()],
    root: fileURLToPath(new URL('../', import.meta.url)),
    mode: 'test',
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    server: { middlewareMode: true, watch: null },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true }
  })
  favorites = (await server.ssrLoadModule('/src/store/modules/favorites.js')).default
  applications = (await server.ssrLoadModule('/src/store/modules/applications.js')).default
  applicationsApi = (await server.ssrLoadModule('/src/api/axios.js')).applicationsApi
  ApplyForm = (await server.ssrLoadModule('/src/components/ApplyForm.vue')).default
})

beforeEach(() => {
  // Для каждого теста создаём отдельный localStorage в памяти.
  const values = new Map()
  storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  }
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage })
  // Неподменённый запрос сразу завершится ошибкой: тесты не используют сеть.
  applicationsApi.defaults.adapter = async () => { throw new Error('Unexpected API request in test') }
})

after(async () => {
  await server?.close()
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else delete globalThis.localStorage
})

// Создаём Vuex с тестовым пользователем вместо настоящего входа.
function makeStore(user = { id: 7 }) {
  return createStore({
    strict: true,
    modules: {
      favorites,
      applications,
      auth: {
        namespaced: true,
        state: () => ({ user }),
        mutations: { SET_USER(state, value) { state.user = value } }
      }
    }
  })
}

function response(config, data) {
  return { config, data, status: 200, statusText: 'OK', headers: {} }
}

function serverError(config, status = 503) {
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, {}, {
    config, data: { message: 'Test failure' }, status, statusText: 'Error', headers: {}
  })
}

// Тест сам решает, когда завершить ожидание успехом или ошибкой.
function deferred() {
  let resolve
  let reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function holdRequest() {
  const started = deferred()
  const finished = deferred()
  const calls = []
  applicationsApi.defaults.adapter = config => {
    calls.push(config)
    started.resolve(config)
    return finished.promise
  }
  return { started, finished, calls }
}

function validForm(overrides = {}) {
  return {
    job: { id: '12', title: 'Vue Developer', company: 'Example Company' },
    name: '  Nursultan  ',
    email: '  nursultan@example.com  ',
    letter: '  I would like to apply for this Vue developer position.  ',
    ...overrides
  }
}

// Проверяем методы формы с настоящим Vuex без браузерного DOM.
// Сам компонент выше компилируется плагином Vue для Vite.
function makeApplyForm(store = makeStore()) {
  const vm = { ...ApplyForm.data(), $store: store, job: validForm().job }
  for (const [name, method] of Object.entries(ApplyForm.methods)) vm[name] = method.bind(vm)
  for (const [name, getter] of Object.entries(ApplyForm.computed)) {
    Object.defineProperty(vm, name, { get: () => getter.call(vm) })
  }
  ApplyForm.created.call(vm)
  return vm
}

function fillForm(vm, overrides = {}) {
  const { job, ...fields } = validForm()
  // В браузере v-model.trim уже убирает пробелы по краям значений.
  vm.form = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value.trim()]))
  Object.assign(vm.form, overrides)
}

test('favorites: toggle persists jobs, reload restores them, and numeric/string IDs match', async () => {
  const store = makeStore()
  const job = { id: 12, title: 'Vue Developer', company: 'Example Company' }
  await store.dispatch('favorites/toggleFavorite', job)
  assert.equal(store.getters['favorites/isFavorite']('12'), true)
  assert.deepEqual(JSON.parse(storage.getItem('favorites')), [job])

  const reloaded = makeStore()
  assert.deepEqual(reloaded.state.favorites.list, [job])
  await reloaded.dispatch('favorites/toggleFavorite', { ...job, id: '12' })
  assert.deepEqual(reloaded.state.favorites.list, [])
  assert.deepEqual(JSON.parse(storage.getItem('favorites')), [])

  await store.dispatch('favorites/removeFavorite', '12')
  assert.deepEqual(store.state.favorites.list, [])
})

test('favorites: invalid JSON/data and unavailable localStorage do not crash the store', () => {
  for (const saved of ['{broken', '{}', '[null]', '[{"title":"No ID"}]']) {
    storage.setItem('favorites', saved)
    const store = makeStore()
    assert.deepEqual(store.state.favorites.list, [])
    assert.ok(store.state.favorites.error)
  }

  storage.getItem = () => { throw new Error('Storage disabled') }
  const store = makeStore()
  assert.deepEqual(store.state.favorites.list, [])
  assert.ok(store.state.favorites.error)
})

test('favorites: quota failure keeps the live selection and reports that it was not saved', async () => {
  const store = makeStore()
  storage.setItem = () => { throw new Error('Quota exceeded') }
  await store.dispatch('favorites/toggleFavorite', { id: '12', title: 'Vue Developer' })
  assert.equal(store.getters['favorites/isFavorite'](12), true)
  assert.ok(store.state.favorites.error)
})

test('applications: POST sends validated trimmed data and stores the server-created ID', async () => {
  const store = makeStore()
  const request = holdRequest()
  const pending = store.dispatch('applications/submitApplication', validForm())
  const config = await request.started.promise

  assert.equal(store.state.applications.submitting, true)
  assert.equal(config.method, 'post')
  assert.equal(config.url, '/applications')
  const payload = JSON.parse(config.data)
  assert.deepEqual({ ...payload, createdAt: 'checked' }, {
    userId: 7, jobId: '12', jobTitle: 'Vue Developer', company: 'Example Company',
    name: 'Nursultan', email: 'nursultan@example.com',
    letter: 'I would like to apply for this Vue developer position.',
    status: 'submitted', createdAt: 'checked'
  })
  assert.ok(Number.isFinite(Date.parse(payload.createdAt)))
  assert.deepEqual(store.state.applications.list, [])

  request.finished.resolve(response(config, { ...payload, id: '91' }))
  const application = await pending
  assert.equal(application.id, '91')
  assert.deepEqual(store.state.applications.list, [application])
  assert.equal(store.state.applications.submitting, false)
  assert.equal(store.state.applications.submitError, null)
})

test('applications: failed POST preserves existing applications and resets the loading flag', async () => {
  const store = makeStore()
  const oldApplication = { id: 'old', userId: 7 }
  store.commit('applications/SET_LIST', [oldApplication])
  applicationsApi.defaults.adapter = async config => { throw serverError(config) }

  await assert.rejects(store.dispatch('applications/submitApplication', validForm()))
  assert.deepEqual(store.state.applications.list, [oldApplication])
  assert.equal(store.state.applications.submitting, false)
  assert.match(store.state.applications.submitError, /503/)
})

test('applications: a response without a created ID cannot report a saved application', async () => {
  const store = makeStore()
  applicationsApi.defaults.adapter = async config => response(config, { message: 'Accepted' })
  await assert.rejects(store.dispatch('applications/submitApplication', validForm()), /id/i)
  assert.deepEqual(store.state.applications.list, [])
  assert.ok(store.state.applications.submitError)
  assert.equal(store.state.applications.submitting, false)
})

test('applications: invalid form or missing user blocks POST before any request', async () => {
  let calls = 0
  applicationsApi.defaults.adapter = async () => { calls += 1; throw new Error('Must not send') }
  const invalidForms = [
    validForm({ name: ' ' }),
    validForm({ name: 'x'.repeat(101) }),
    validForm({ email: 'invalid-email' }),
    validForm({ letter: 'Too short' }),
    validForm({ letter: 'x'.repeat(5001) }),
    validForm({ job: {} })
  ]
  for (const form of invalidForms) {
    const store = makeStore()
    await assert.rejects(store.dispatch('applications/submitApplication', form))
    assert.ok(store.state.applications.submitError)
    assert.equal(store.state.applications.submitting, false)
    assert.deepEqual(store.state.applications.list, [])
  }
  await assert.rejects(makeStore(null).dispatch('applications/submitApplication', validForm()))
  assert.equal(calls, 0)
})

test('applications: repeated submission while POST is pending sends only one request', async () => {
  const store = makeStore()
  const request = holdRequest()
  const first = store.dispatch('applications/submitApplication', validForm())
  const config = await request.started.promise
  await assert.rejects(store.dispatch('applications/submitApplication', validForm()), /Дождитесь/)
  assert.equal(request.calls.length, 1)
  request.finished.resolve(response(config, { id: '91' }))
  await first
  assert.equal(store.state.applications.list.length, 1)
})

test('applications: GET requests the user and excludes partial matches and other users', async () => {
  const store = makeStore()
  const request = holdRequest()
  const pending = store.dispatch('applications/fetchApplications')
  const config = await request.started.promise
  assert.equal(store.state.applications.loading, true)
  assert.equal(config.method, 'get')
  assert.equal(config.url, '/applications')
  assert.deepEqual(config.params, { userId: 7 })
  const ownOlder = { id: '1', userId: '7', createdAt: '2026-10-19T12:00:00Z' }
  const ownNewer = { id: '2', userId: 7, createdAt: '2026-10-20T12:00:00Z' }
  const wrongUser = { id: '3', userId: 17 }
  request.finished.resolve(response(config, [ownOlder, ownNewer, wrongUser, { id: '4', userId: '70' }, null]))
  await pending
  assert.deepEqual(store.state.applications.list, [ownOlder, ownNewer])
  assert.deepEqual(store.getters['applications/userApplications'], [ownNewer, ownOlder])
  assert.equal(store.state.applications.loading, false)
  assert.equal(store.state.applications.error, null)

  // Getter оставляет только свои отклики, даже если в store попали чужие записи.
  store.commit('applications/SET_LIST', [ownOlder, wrongUser])
  assert.deepEqual(store.getters['applications/userApplications'], [ownOlder])
})

test('applications: unauthenticated GET clears old data without making a request', async () => {
  const store = makeStore(null)
  store.commit('applications/SET_LIST', [{ id: 'old', userId: 7 }])
  await store.dispatch('applications/fetchApplications')
  assert.deepEqual(store.state.applications.list, [])
  assert.deepEqual(store.getters['applications/userApplications'], [])
  assert.ok(store.state.applications.error)
  assert.equal(store.state.applications.loading, false)
})

for (const status of [404, 503]) {
  test(`applications: GET ${status} displays an error and finishes loading`, async () => {
    const store = makeStore()
    applicationsApi.defaults.adapter = async config => { throw serverError(config, status) }
    await store.dispatch('applications/fetchApplications')
    assert.deepEqual(store.state.applications.list, [])
    assert.equal(store.state.applications.loading, false)
    if (status === 404) assert.match(store.state.applications.error, /applications/)
    else assert.match(store.state.applications.error, /503/)
  })
}

test('applications: non-array GET data displays an error rather than breaking the page', async () => {
  const store = makeStore()
  applicationsApi.defaults.adapter = async config => response(config, { message: 'Not a list' })
  await store.dispatch('applications/fetchApplications')
  assert.deepEqual(store.state.applications.list, [])
  assert.ok(store.state.applications.error)
  assert.equal(store.state.applications.loading, false)
})

for (const operation of ['fetch', 'submit']) {
  for (const transition of ['reset', 'logout', 'account switch']) {
    test(`applications: late ${operation} success is ignored after ${transition}`, async () => {
      const store = makeStore()
      const request = holdRequest()
      const action = operation === 'fetch' ? 'fetchApplications' : 'submitApplication'
      const pending = store.dispatch('applications/' + action, validForm())
      const config = await request.started.promise

      // Вход и выход сбрасывают отклики при смене сессии.
      await store.dispatch('applications/reset')
      if (transition !== 'reset') {
        store.commit('auth/SET_USER', transition === 'logout' ? null : { id: 8 })
      }
      const oldApplication = { id: '91', userId: 7 }
      request.finished.resolve(response(config, operation === 'fetch' ? [oldApplication] : oldApplication))
      await pending

      assert.deepEqual(store.state.applications.list, [])
      assert.equal(store.state.applications.error, null)
      assert.equal(store.state.applications.submitError, null)
      assert.equal(store.state.applications.loading, false)
      assert.equal(store.state.applications.submitting, false)
    })
  }

  test(`applications: late ${operation} failure cannot replace reset state with an old error`, async () => {
    const store = makeStore()
    const request = holdRequest()
    const action = operation === 'fetch' ? 'fetchApplications' : 'submitApplication'
    const pending = store.dispatch('applications/' + action, validForm())
    const settled = operation === 'submit' ? assert.rejects(pending) : pending
    const config = await request.started.promise
    await store.dispatch('applications/reset')
    request.finished.reject(serverError(config))
    await settled
    assert.deepEqual(store.state.applications.list, [])
    assert.equal(store.state.applications.error, null)
    assert.equal(store.state.applications.submitError, null)
  })

  test(`applications: an old ${operation} response cannot end a newer user's pending request`, async () => {
    const store = makeStore()
    const oldRequest = holdRequest()
    const action = operation === 'fetch' ? 'fetchApplications' : 'submitApplication'
    const oldPending = store.dispatch('applications/' + action, validForm())
    const oldConfig = await oldRequest.started.promise
    await store.dispatch('applications/reset')
    store.commit('auth/SET_USER', { id: 8 })

    const newRequest = holdRequest()
    const newPending = store.dispatch('applications/' + action, validForm())
    const newConfig = await newRequest.started.promise
    const oldApplication = { id: 'old', userId: 7 }
    oldRequest.finished.resolve(response(oldConfig, operation === 'fetch' ? [oldApplication] : oldApplication))
    await oldPending
    assert.deepEqual(store.state.applications.list, [])
    assert.equal(store.state.applications[operation === 'fetch' ? 'loading' : 'submitting'], true)

    const newApplication = { id: 'new', userId: 8 }
    newRequest.finished.resolve(response(newConfig, operation === 'fetch' ? [newApplication] : newApplication))
    await newPending
    assert.deepEqual(store.state.applications.list.map(item => item.id), ['new'])
    assert.equal(store.state.applications[operation === 'fetch' ? 'loading' : 'submitting'], false)
  })
}

test('ApplyForm: pre-fills the authenticated profile and clears previous feedback', () => {
  const store = makeStore({ id: 7, firstName: 'Nursultan', lastName: 'Test', email: 'test@example.com' })
  store.commit('applications/SET_SUBMIT_ERROR', 'Old request failed')
  const vm = makeApplyForm(store)
  assert.deepEqual(vm.form, { name: 'Nursultan Test', email: 'test@example.com', letter: '' })
  assert.equal(vm.success, false)
  assert.equal(vm.submitError, null)
})

test('ApplyForm: invalid name, email or letter displays field errors without POST', async () => {
  let calls = 0
  applicationsApi.defaults.adapter = async () => { calls += 1; throw new Error('Must not send') }
  for (const [field, value] of [['name', ''], ['email', 'not-an-email'], ['letter', 'Short']]) {
    const vm = makeApplyForm()
    fillForm(vm, { [field]: value })
    await vm.submit()
    assert.ok(vm.errors[field])
    assert.equal(vm.hasFieldErrors, true)
    assert.equal(vm.success, false)
  }
  assert.equal(calls, 0)
})

test('ApplyForm: valid submit waits for POST, marks success, and blocks duplicate sends', async () => {
  const store = makeStore()
  const vm = makeApplyForm(store)
  fillForm(vm)
  const request = holdRequest()
  const pending = vm.submit()
  const config = await request.started.promise
  assert.equal(vm.submitting, true)
  assert.equal(vm.success, false)
  assert.equal(JSON.parse(config.data).email, vm.form.email)

  await vm.submit()
  assert.equal(request.calls.length, 1)
  request.finished.resolve(response(config, { id: 'created-from-form' }))
  await pending
  assert.equal(vm.success, true)
  assert.equal(vm.submitting, false)
  assert.equal(store.state.applications.list[0].id, 'created-from-form')

  await vm.submit()
  assert.equal(request.calls.length, 1)
})

test('ApplyForm: failed POST preserves input, shows the error, and allows a retry', async () => {
  const vm = makeApplyForm()
  fillForm(vm)
  const entered = { ...vm.form }
  applicationsApi.defaults.adapter = async config => { throw serverError(config) }
  await vm.submit()
  assert.deepEqual(vm.form, entered)
  assert.equal(vm.success, false)
  assert.equal(vm.submitting, false)
  assert.match(vm.submitError, /503/)

  applicationsApi.defaults.adapter = async config => response(config, { id: 'retry-success' })
  await vm.submit()
  assert.equal(vm.success, true)
  assert.equal(vm.submitError, null)
})

test('ApplyForm: a response from the previous account cannot mark the new form successful', async () => {
  const store = makeStore()
  const vm = makeApplyForm(store)
  fillForm(vm)
  const request = holdRequest()
  const pending = vm.submit()
  const config = await request.started.promise
  await store.dispatch('applications/reset')
  store.commit('auth/SET_USER', { id: 8 })
  vm.resetForm()
  request.finished.resolve(response(config, { id: 'old-user-application' }))
  await pending
  assert.equal(vm.success, false)
  assert.deepEqual(store.state.applications.list, [])
})
