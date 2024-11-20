'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import { FiImage, FiX, FiEye, FiEdit2, FiSave } from 'react-icons/fi'

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
)

const MDPreview = dynamic(
  () => import('@uiw/react-markdown-preview').then((mod) => mod.default),
  { ssr: false }
)

const AUTOSAVE_DELAY = 3000 // 3 seconds

export default function NewArticlePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isDraft, setIsDraft] = useState(false)

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem('articleDraft')
    if (draft) {
      const { title, content, tags, excerpt, coverImage } = JSON.parse(draft)
      setTitle(title)
      setContent(content)
      setTags(tags)
      setExcerpt(excerpt)
      setCoverImage(coverImage)
      setIsDraft(true)
    }
  }, [])

  // Autosave to localStorage
  const saveToLocalStorage = useCallback(() => {
    const draft = {
      title,
      content,
      tags,
      excerpt,
      coverImage,
    }
    localStorage.setItem('articleDraft', JSON.stringify(draft))
    setLastSaved(new Date())
    setIsDraft(true)
  }, [title, content, tags, excerpt, coverImage])

  useEffect(() => {
    const timer = setTimeout(saveToLocalStorage, AUTOSAVE_DELAY)
    return () => clearTimeout(timer)
  }, [title, content, tags, excerpt, coverImage, saveToLocalStorage])

  const handleFileUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to upload image')
      }

      const { url } = await response.json()
      setCoverImage(url)
    } catch (error) {
      console.error('Upload error:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload image')
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    await handleFileUpload(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          tags: tags.split(',').map((tag) => tag.trim()),
          excerpt,
          coverImage,
          readingTime: Math.ceil(content.split(' ').length / 200), // Approximate reading time
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to create article')
      }

      const data = await response.json()
      localStorage.removeItem('articleDraft') // Clear draft after successful publish
      router.push(`/article/${data.article.slug}`)
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Failed to create article')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Write a new article</h1>
        <div className="flex items-center gap-4">
          {isDraft && lastSaved && (
            <span className="text-sm text-gray-500">
              Last saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            {isPreview ? (
              <>
                <FiEdit2 className="mr-2" /> Edit
              </>
            ) : (
              <>
                <FiEye className="mr-2" /> Preview
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md mb-6">{error}</div>
      )}

      {isPreview ? (
        <div className="bg-white rounded-lg shadow-md p-8">
          {coverImage && (
            <div className="relative w-full aspect-[2/1] mb-8">
              <Image
                src={coverImage}
                alt={title}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          )}
          <h1 className="text-4xl font-bold mb-4">{title}</h1>
          {excerpt && (
            <p className="text-xl text-gray-600 mb-8 italic">{excerpt}</p>
          )}
          <div className="prose max-w-none">
            <MDPreview source={content} />
          </div>
          {tags && (
            <div className="mt-8 flex gap-2">
              {tags.split(',').map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Image Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image
            </label>
            <div 
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
                isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300'
              } border-dashed rounded-md relative`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {coverImage ? (
                <div className="relative w-full aspect-[2/1]">
                  <Image
                    src={coverImage}
                    alt="Cover"
                    fill
                    className="object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => setCoverImage('')}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-lg"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1 text-center">
                  <FiImage className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer rounded-md font-medium text-green-600 hover:text-green-500">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          await handleFileUpload(file)
                        }}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                </div>
              )}
            </div>
            <input
              type="text"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="Or enter image URL"
              className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>

          {/* Title Section */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>

          {/* Excerpt Section */}
          <div>
            <label
              htmlFor="excerpt"
              className="block text-sm font-medium text-gray-700"
            >
              Excerpt (Brief summary of your article)
            </label>
            <textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>

          {/* Content Section */}
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Content
            </label>
            <div data-color-mode="light" className="prose max-w-none">
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || '')}
                height={500}
                preview="edit"
                className="w-full"
              />
            </div>
          </div>

          {/* Tags Section */}
          <div>
            <label
              htmlFor="tags"
              className="block text-sm font-medium text-gray-700"
            >
              Tags (comma separated)
            </label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="technology, programming, web development"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={saveToLocalStorage}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiSave className="mr-2" /> Save Draft
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isLoading ? 'Publishing...' : 'Publish Article'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
