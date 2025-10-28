import axios from 'axios'

export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect to login on 401s and clear token
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      const token = localStorage.getItem('token')
      // Skip redirect if using development bypass token
      if (token === 'dev-token-bypass') {
        return Promise.reject(err)
      }
      
      localStorage.removeItem('token')
      // Soft redirect to login unless we're already there; avoid infinite loops
      try {
        if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.history.replaceState({}, '', '/login')
          // Trigger a reload to remount routes
          window.location.reload()
        }
      } catch {}
    }
    return Promise.reject(err)
  }
)

export function setToken(token) {
  if (token) localStorage.setItem('token', token)
  else localStorage.removeItem('token')
}

export function getToken() {
  return localStorage.getItem('token')
}

// Proactively remove obviously invalid tokens on app bootstrap
if (typeof window !== 'undefined') {
  const t = localStorage.getItem('token')
  if (t && (t === 'undefined' || t === 'null' || t.trim() === '')) {
    localStorage.removeItem('token')
  }
}


