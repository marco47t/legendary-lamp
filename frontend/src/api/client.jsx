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
  failedQueue.forEach(prom => error ? prom.reject(error) : prom.resolve(token))
  failedQueue = []
}

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config

    // Not a 401, or it's already a retry, or it's an aborted request — skip
    if (
      err.response?.status !== 401 ||
      original._retry ||
      err.code === 'ERR_CANCELED'
    ) {
      return Promise.reject(err)
    }

    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      // No refresh token at all — hard logout
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.replace('/login')
      return Promise.reject(err)
    }

    if (isRefreshing) {
      // Queue this request until the refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(token => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
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
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      window.location.replace('/login')
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  }
)

export default api