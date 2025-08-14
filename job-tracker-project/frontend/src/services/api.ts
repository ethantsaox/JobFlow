import axios, { AxiosInstance, AxiosResponse } from 'axios'

// Centralized API URL configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // Reduced timeout for faster feedback
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Try to refresh token
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          })

          const { access_token } = response.data
          localStorage.setItem('token', access_token)

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
      } else {
        // No refresh token, redirect to login
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// Analytics API functions
export const analyticsApi = {
  getSummary: () => api.get('/api/analytics/summary'),
  getTimeline: (days: number = 30) => api.get(`/api/analytics/timeline?days=${days}`),
  getStatusTimeline: (days: number = 30) => api.get(`/api/analytics/status-timeline?days=${days}`),
  getStatusBreakdown: () => api.get('/api/analytics/status-breakdown'),
  getCompanyInsights: () => api.get('/api/analytics/companies'),
}

// Job Applications API functions  
export const jobApplicationsApi = {
  getAll: (params?: any) => api.get('/api/job-applications', { params }),
  getById: (id: string) => api.get(`/api/job-applications/${id}`),
  create: (data: any) => api.post('/api/job-applications', data),
  update: (id: string, data: any) => api.put(`/api/job-applications/${id}`, data),
  delete: (id: string) => api.delete(`/api/job-applications/${id}`),
}

export default api