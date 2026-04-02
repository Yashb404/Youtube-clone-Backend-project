import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setCurrentVideo } from '../store/slices/videoSlice'
import axios from 'axios'

const VideoPlayer = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { currentVideo } = useSelector((state) => state.video)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await axios.get(`/api/v1/videos/${id}`)
        dispatch(setCurrentVideo(response.data))
      } catch (error) {
        console.error('Failed to fetch video:', error)
      }
    }

    const fetchComments = async () => {
      try {
        const response = await axios.get(`/api/v1/comments/${id}`)
        setComments(response.data)
      } catch (error) {
        console.error('Failed to fetch comments:', error)
      }
    }

    fetchVideo()
    fetchComments()
  }, [id, dispatch])

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      const response = await axios.post(`/api/v1/comments/${id}`, {
        content: newComment,
      })
      setComments([...comments, response.data])
      setNewComment('')
    } catch (error) {
      console.error('Failed to post comment:', error)
    }
  }

  if (!currentVideo) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="aspect-video bg-black mb-6 border border-gray-800">
        <video
          src={currentVideo.videoUrl}
          controls
          className="w-full h-full"
          poster={currentVideo.thumbnail}
        />
      </div>

      <div className="mb-8 border border-gray-800 p-4 bg-secondary">
        <h1 className="text-2xl font-bold mb-2 uppercase tracking-wide">{currentVideo.title}</h1>
        <div className="flex items-center justify-between text-gray-400 mb-4">
          <div className="flex items-center">
            <img
              src={currentVideo.owner.avatar}
              alt={currentVideo.owner.username}
              className="w-10 h-10 object-cover border border-gray-700 mr-3"
            />
            <span>{currentVideo.owner.username}</span>
          </div>
          <div>
            {currentVideo.views} views •{' '}
            {new Date(currentVideo.createdAt).toLocaleDateString()}
          </div>
        </div>
        <p className="text-gray-300">{currentVideo.description}</p>
      </div>

      <div className="border-t border-gray-700 pt-6">
        <h2 className="text-xl font-bold mb-4 uppercase tracking-wide">Comments</h2>
        {user && (
          <form onSubmit={handleCommentSubmit} className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="input w-full h-24 mb-2"
            />
            <button type="submit" className="btn btn-primary">
              Comment
            </button>
          </form>
        )}
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment._id} className="flex space-x-4 border border-gray-800 p-3 bg-secondary">
              <img
                src={comment.owner.avatar}
                alt={comment.owner.username}
                className="w-10 h-10 object-cover border border-gray-700"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{comment.owner.username}</span>
                  <span className="text-gray-400 text-sm">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-300 mt-1">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer 