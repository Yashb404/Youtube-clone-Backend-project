import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { store } from './store'
import './index.css'

// Add axios interceptor for token
import axios from 'axios'

// Request interceptor
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const response = await axios.post('/api/v1/users/refresh-token', {
          refreshToken
        })

        const { accessToken, refreshToken: newRefreshToken } = response.data

        // Update tokens in localStorage
        localStorage.setItem('token', accessToken)
        localStorage.setItem('refreshToken', newRefreshToken)

        // Update the failed request's authorization header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`

        // Retry the original request
        return axios(originalRequest)
      } catch (refreshError) {
        // If refresh token fails, logout user
        store.dispatch({ type: 'auth/logout' })
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
) 