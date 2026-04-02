import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import axios from 'axios'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
  })
  const [recentVideos, setRecentVideos] = useState([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, videosResponse] = await Promise.all([
          axios.get('/api/v1/dashboard/stats'),
          axios.get('/api/v1/dashboard/recent-videos'),
        ])
        setStats(statsResponse.data)
        setRecentVideos(videosResponse.data)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 uppercase tracking-wide">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-secondary p-6 border border-gray-800">
          <h3 className="text-gray-400 mb-2 text-xs uppercase tracking-wide">Total Videos</h3>
          <p className="text-2xl font-bold">{stats.totalVideos}</p>
        </div>
        <div className="bg-secondary p-6 border border-gray-800">
          <h3 className="text-gray-400 mb-2 text-xs uppercase tracking-wide">Total Views</h3>
          <p className="text-2xl font-bold">{stats.totalViews}</p>
        </div>
        <div className="bg-secondary p-6 border border-gray-800">
          <h3 className="text-gray-400 mb-2 text-xs uppercase tracking-wide">Total Likes</h3>
          <p className="text-2xl font-bold">{stats.totalLikes}</p>
        </div>
        <div className="bg-secondary p-6 border border-gray-800">
          <h3 className="text-gray-400 mb-2 text-xs uppercase tracking-wide">Total Comments</h3>
          <p className="text-2xl font-bold">{stats.totalComments}</p>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold uppercase tracking-wide">Recent Videos</h2>
          <Link to="/upload" className="btn btn-primary">
            Upload New Video
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentVideos.map((video) => (
            <Link
              key={video._id}
              to={`/video/${video._id}`}
              className="bg-secondary border border-gray-800 overflow-hidden hover:border-white transition-colors duration-200"
            >
              <div className="aspect-video bg-black border-b border-gray-800">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 uppercase tracking-wide">{video.title}</h3>
                <p className="text-gray-400 text-sm">
                  {video.views} views • {new Date(video.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard 