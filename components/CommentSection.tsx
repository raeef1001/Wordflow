'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'

interface Comment {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
}

export function CommentSection({
  articleId,
  initialComments,
}: {
  articleId: string
  initialComments: number
}) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchComments()
  }, [articleId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/articles/${articleId}/comments`)
      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }
      const data = await response.json()
      setComments(data.comments)
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!session) {
      // Redirect to login or show login modal
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to post comment')
      }

      const data = await response.json()
      setComments((prev) => [data.comment, ...prev])
      setNewComment('')
    } catch (error) {
      setError('Failed to post comment')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-12 max-w-3xl mx-auto">
      <h2 className="text-xl font-medium mb-8 text-gray-800 dark:text-gray-200">
        {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
      </h2>

      {session && (
        <form onSubmit={handleSubmit} className="mb-12">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          <div className="relative mb-4 group">
            <textarea
              id="comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add to the discussion"
              className="w-full px-0 py-4 bg-transparent border-0 border-b-2 border-gray-200 dark:border-gray-700 focus:ring-0 focus:border-blue-500 transition-all duration-200 min-h-[80px] resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
              required
            />
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-200 origin-left" />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !newComment.trim()}
              className="px-6 py-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-full text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                'Reply'
              )}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-8">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="group"
          >
            <div className="flex items-start gap-4">
              {comment.author.image ? (
                <img
                  src={comment.author.image}
                  alt={comment.author.name || ''}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {comment.author.name?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {comment.author.name || 'Anonymous'}
                  </span>
                  <time className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(comment.createdAt), 'MMM d')}
                  </time>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
