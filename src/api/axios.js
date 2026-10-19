import axios from 'axios'

export const authApi = axios.create({ baseURL: 'https://dummyjson.com' })

export const jobsApi = axios.create({ baseURL: 'https://6ad66153f71f154ac486cef0.mockapi.io' })