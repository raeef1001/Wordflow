'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { FiMessageSquare, FiSend } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [isExpanded, setIsExpanded] = useState(false)

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
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 mb-6"
      >
        <FiMessageSquare className="w-5 h-5" />
        <span className="font-medium">
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {session && (
              <form onSubmit={handleSubmit} className="mb-8">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 p-3 rounded-lg mb-4 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
                <div className="relative mb-4 group">
                  <textarea
                    id="comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 dark:border-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-all duration-200 min-h-[100px] resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    required
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isLoading || !newComment.trim()}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                    >
                      {isLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Posting...</span>
                        </>
                      ) : (
                        <>
                          <span>Post</span>
                          <FiSend className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {comments.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl bg-white dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200 group"
                >
                  <div className="flex items-start gap-3">
                    {comment.author.image ? (
                      <img
                        src={comment.author.image}
                        alt={comment.author.name || ''}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800 group-hover:ring-gray-200 dark:group-hover:ring-gray-700 transition-all duration-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                          {comment.author.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {comment.author.name || 'Anonymous'}
                        </p>
                        <time className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                        </time>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
