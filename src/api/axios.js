import axios from 'axios'

// Запросы ждут ответ сервера не дольше 15 секунд.
export const authApi = axios.create({ baseURL: 'https://dummyjson.com', timeout: 15000 })

// Адрес MockAPI можно изменить в файле .env.
const mockApiBaseURL = import.meta.env.VITE_MOCKAPI_BASE_URL || 'https://6ad66153f71f154ac486cef0.mockapi.io'

export const jobsApi = axios.create({ baseURL: mockApiBaseURL, timeout: 15000 })

// Отклики могут храниться в отдельном проекте MockAPI.
export const applicationsApi = axios.create({
  baseURL: import.meta.env.VITE_APPLICATIONS_API_BASE_URL || mockApiBaseURL,
  timeout: 15000
})
