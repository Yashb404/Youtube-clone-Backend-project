import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { addVideo } from '../store/slices/videoSlice'
import axios from 'axios'

const VideoUpload = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoFile: null,
    thumbnail: null,
  })
  const [uploadProgress, setUploadProgress] = useState(0)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector((state) => state.video)

  const handleChange = (e) => {
    const { name, value, files } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formDataToSend = new FormData()
    formDataToSend.append('title', formData.title)
    formDataToSend.append('description', formData.description)
    formDataToSend.append('video', formData.videoFile)
    formDataToSend.append('thumbnail', formData.thumbnail)

    try {
      const response = await axios.post('/api/v1/videos', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          setUploadProgress(progress)
        },
      })

      dispatch(addVideo(response.data))
      navigate(`/video/${response.data._id}`)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  return (
    <div className="max-w-2xl mx-auto border border-gray-800 p-6 bg-secondary">
      <h2 className="text-2xl font-bold mb-6 uppercase tracking-wide">Upload Video</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block mb-2 text-sm uppercase tracking-wide text-gray-300">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="input w-full"
            autoComplete="off"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block mb-2 text-sm uppercase tracking-wide text-gray-300">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="input w-full h-32"
            autoComplete="off"
            required
          />
        </div>
        <div>
          <label htmlFor="videoFile" className="block mb-2 text-sm uppercase tracking-wide text-gray-300">
            Video File
          </label>
          <input
            type="file"
            id="videoFile"
            name="videoFile"
            onChange={handleChange}
            className="input w-full"
            accept="video/*"
            required
          />
        </div>
        <div>
          <label htmlFor="thumbnail" className="block mb-2 text-sm uppercase tracking-wide text-gray-300">
            Thumbnail
          </label>
          <input
            type="file"
            id="thumbnail"
            name="thumbnail"
            onChange={handleChange}
            className="input w-full"
            accept="image/*"
            required
          />
        </div>
        {uploadProgress > 0 && (
          <div className="w-full bg-black border border-gray-700 h-2.5">
            <div
              className="bg-white h-2.5"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? 'Uploading...' : 'Upload Video'}
        </button>
      </form>
    </div>
  )
}

export default VideoUpload 