import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice'
import axios from 'axios'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector((state) => state.auth)

  useEffect(() => {
    // Set up axios interceptor for token refresh
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          try {
            const response = await axios.post('/api/v1/users/refresh-token')
            const { accessToken } = response.data
            localStorage.setItem('token', accessToken)
            // Retry the original request
            error.config.headers['Authorization'] = `Bearer ${accessToken}`
            return axios(error.config)
          } catch (refreshError) {
            dispatch(loginFailure('Session expired. Please login again.'))
            navigate('/login')
            return Promise.reject(refreshError)
          }
        }
        return Promise.reject(error)
      }
    )

    return () => {
      axios.interceptors.response.eject(interceptor)
    }
  }, [dispatch, navigate])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    dispatch(loginStart())

    try {
      const response = await axios.post('/api/v1/users/login', formData)
      const { accessToken, refreshToken, user } = response.data
      dispatch(loginSuccess({ user, token: accessToken }))
      localStorage.setItem('token', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      navigate('/dashboard')
    } catch (error) {
      dispatch(loginFailure(error.response?.data?.message || 'Login failed'))
    }
  }

  return (
    <div className="max-w-md mx-auto border border-gray-800 p-6 bg-secondary">
      <h2 className="text-2xl font-bold mb-6 uppercase tracking-wide">Login</h2>
      {error && (
        <div className="border border-white text-white p-3 mb-4 text-sm uppercase tracking-wide">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block mb-2 text-sm uppercase tracking-wide text-gray-300">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="input w-full"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block mb-2 text-sm uppercase tracking-wide text-gray-300">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="input w-full"
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm uppercase tracking-wide text-gray-400">
        Don't have an account?{' '}
        <Link to="/register" className="text-white hover:text-gray-300 transition-colors">
          Register
        </Link>
      </p>
    </div>
  )
}

export default Login 