import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import VideoUpload from './pages/VideoUpload'
import VideoPlayer from './pages/VideoPlayer'
import Profile from './pages/Profile'
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <div className="min-h-screen bg-primary font-mono">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/video/:id" element={<VideoPlayer />} />
          
          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<VideoUpload />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </main>
    </div>
  )
}

export default App 