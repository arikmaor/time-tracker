import axios from 'axios'
const BASE_API_URL = '/api'

const apiClient = axios.create({
  baseURL: BASE_API_URL
})

export default apiClient
