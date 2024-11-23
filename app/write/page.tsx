'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { FiImage, FiX, FiEye, FiEdit2 } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import './editor.css'

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
)

export default function WritePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (editId) {
      setIsEditing(true)
      loadArticle(editId)
    }
  }, [editId])

  const loadArticle = async (id: string) => {
    try {
      const response = await fetch(`/api/articles/${id}`)
      if (!response.ok) throw new Error('Failed to fetch article')
      
      const article = await response.json()
      setTitle(article.title)
      setContent(article.content)
      setCoverImage(article.coverImage)
      setTags(article.tags.map((t: any) => t.tag.name))
    } catch (error) {
      console.error('Error loading article:', error)
      toast.error('Failed to load article')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    const uploadToast = toast.loading('Uploading image...')

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const data = await response.json()
      setCoverImage(data.url)
      toast.success('Image uploaded successfully', { id: uploadToast })
    } catch (error) {
      toast.error('Failed to upload image', { id: uploadToast })
      console.error('Upload error:', error)
    }
  }

  const handleTagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
        toast.success(`Added tag: ${tagInput.trim()}`)
      } else {
        toast.error('Tag already exists')
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
    toast.success(`Removed tag: ${tagToRemove}`)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (!content.trim()) {
      toast.error('Please enter some content')
      return
    }

    setIsLoading(true)
    const publishToast = toast.loading(isEditing ? 'Updating your article...' : 'Publishing your article...')

    try {
      const response = await fetch(isEditing ? `/api/articles/${editId}` : '/api/articles', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          coverImage,
          tags,
          status: 'PUBLISHED',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to publish article')
      }

      const data = await response.json()
      toast.success(isEditing ? 'Article updated successfully!' : 'Article published successfully!', { id: publishToast })
      router.push(`/article/${data.slug}`)
    } catch (error) {
      toast.error('Failed to publish article', { id: publishToast })
      console.error('Publish error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublish = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    const publishToast = toast.loading(isEditing ? 'Updating your article...' : 'Publishing your article...')

    try {
      const response = await fetch(isEditing ? `/api/articles/${editId}` : '/api/articles', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          coverImage,
          tags,
          status: 'PUBLISHED',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to publish article')
      }

      const data = await response.json()
      toast.success(isEditing ? 'Article updated successfully!' : 'Article published successfully!', { id: publishToast })
      router.push(`/article/${data.slug}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to publish article', { id: publishToast })
      console.error('Publish error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif text-gray-900 dark:text-gray-100">
            {isEditing ? 'Edit Article' : 'Write Article'}
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPreviewMode(previewMode === 'edit' ? 'preview' : 'edit')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {previewMode === 'edit' ? (
                <>
                  <FiEye className="w-4 h-4" />
                  Preview
                </>
              ) : (
                <>
                  <FiEdit2 className="w-4 h-4" />
                  Edit
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Cover Image Section */}
          <div className="relative">
            {coverImage ? (
              <div className="relative h-[300px] rounded-xl overflow-hidden group">
                <Image
                  src={coverImage}
                  alt="Cover"
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => setCoverImage(null)}
                  className="absolute top-4 right-4 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiX className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
              </div>
            ) : (
              <label className="block h-[200px] rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                  <FiImage className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">Add cover image</span>
                </div>
              </label>
            )}
          </div>

          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full px-0 text-4xl font-serif font-medium bg-transparent border-0 border-b-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400 focus:ring-0 placeholder-gray-400 dark:placeholder-gray-600 text-gray-900 dark:text-gray-100"
          />

          {/* Tags Input */}
          <div className="flex flex-wrap gap-2 items-center min-h-[40px] py-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="p-0.5 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagAdd}
              placeholder="Add tags..."
              className="flex-1 min-w-[120px] bg-transparent border-0 focus:ring-0 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600"
            />
          </div>

          {/* Content Editor */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <MDEditor
              value={content}
              onChange={(value) => setContent(value || '')}
              preview={previewMode}
              className="!bg-transparent"
              height={500}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-6">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePublish}
              disabled={isLoading || !title.trim() || !content.trim()}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-full text-sm font-medium transition-colors disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                'Publish'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
