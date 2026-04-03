import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (!config.headers['Content-Type']) config.headers['Content-Type'] = 'application/json'
  return config
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token))
  failedQueue = []
}

const forceLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
  window.location.replace('/login')
}

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config

    // Ignore cancelled/aborted requests (happen during page navigation)
    if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') {
      return Promise.reject(err)
    }

    // Not a 401 → pass through normally
    if (err.response?.status !== 401) {
      return Promise.reject(err)
    }

    // Already retried once → give up and logout
    if (original._retry) {
      forceLogout()
      return Promise.reject(err)
    }

    const refreshToken = localStorage.getItem('refresh_token')

    // No refresh token saved → logout immediately
    if (!refreshToken) {
      forceLogout()
      return Promise.reject(err)
    }

    // Another refresh is already in progress → queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(token => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      }).catch(e => Promise.reject(e))
    }

    original._retry = true
    isRefreshing = true

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      )
      const { access_token, refresh_token: newRefresh } = res.data
      localStorage.setItem('token', access_token)
      if (newRefresh) localStorage.setItem('refresh_token', newRefresh)
      api.defaults.headers.common.Authorization = `Bearer ${access_token}`
      processQueue(null, access_token)
      original.headers.Authorization = `Bearer ${access_token}`
      return api(original)
    } catch (refreshErr) {
      processQueue(refreshErr, null)
      forceLogout()
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  }
)

export default api