import { Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../store/slices/authSlice'

const Navbar = () => {
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  const handleLogout = () => {
    dispatch(logout())
  }

  return (
    <nav className="bg-primary border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-white tracking-widest uppercase">
            Video Platform
          </Link>

          <div className="flex items-center space-x-6 text-sm uppercase tracking-wide">
            {isAuthenticated ? (
              <>
                <Link to="/upload" className="btn btn-primary">
                  Upload Video
                </Link>
                <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                  Dashboard
                </Link>
                <Link to="/profile" className="text-gray-400 hover:text-white transition-colors">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-white transition-colors uppercase tracking-wide"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 