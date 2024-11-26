'use client'

import { useState } from 'react'
import { User } from 'next-auth'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FiUser, FiMail, FiFileText, FiAlertCircle, FiUpload } from 'react-icons/fi'

interface SettingsFormProps {
  user: User & {
    id?: string
    bio?: string | null
  }
}

export default function SettingsForm({ user }: SettingsFormProps) {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    image: user.image || '',
    bio: user.bio || '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(formData.image)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('File must be an image')
      return
    }

    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null

    const formData = new FormData()
    formData.append('file', imageFile)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      let imageUrl = formData.image
      if (imageFile) {
        imageUrl = await uploadImage() || imageUrl
      }

      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          bio: formData.bio,
          image: imageUrl,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || 'Failed to update settings')
      }

      const updatedUser = await response.json()
      setFormData(prev => ({
        ...prev,
        ...updatedUser,
      }))

      // Update the session with new user data
      await update({
        ...session,
        user: {
          ...session?.user,
          name: updatedUser.name,
          image: updatedUser.image,
          bio: updatedUser.bio,
        },
      })

      // Refresh the router to update all server components
      router.refresh()
    } catch (error) {
      console.error('Error updating settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to update settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <FiAlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Profile Image Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt={formData.name}
              width={80}
              height={80}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <FiUser className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div>
            <h3 className="font-medium mb-1">Profile Picture</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Upload a new profile picture
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <FiUpload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG or GIF (MAX. 5MB)
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
          </label>
        </div>
      </div>

      {/* Name Input */}
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <div className="flex items-center space-x-2">
            <FiUser className="w-4 h-4" />
            <span>Name</span>
          </div>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="block w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 text-gray-900 dark:text-gray-100 shadow-sm dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      {/* Email Input */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <div className="flex items-center space-x-2">
            <FiMail className="w-4 h-4" />
            <span>Email</span>
          </div>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="block w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 text-gray-900 dark:text-gray-100 shadow-sm dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100 dark:bg-gray-900"
          disabled
        />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Email cannot be changed
        </p>
      </div>

      {/* Bio Input */}
      <div className="space-y-2">
        <label
          htmlFor="bio"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <div className="flex items-center space-x-2">
            <FiFileText className="w-4 h-4" />
            <span>Bio</span>
          </div>
        </label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows={4}
          className="block w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 text-gray-900 dark:text-gray-100 shadow-sm dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Tell us about yourself..."
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
