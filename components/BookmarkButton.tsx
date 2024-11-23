'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface BookmarkButtonProps {
  articleId: string
  isBookmarked: boolean
}

export function BookmarkButton({ articleId, isBookmarked: initialIsBookmarked }: BookmarkButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)
  const [isLoading, setIsLoading] = useState(false)

  const handleBookmark = async () => {
    if (!session) {
      router.push('/login')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articleId }),
      })

      if (!response.ok) {
        throw new Error('Failed to bookmark')
      }

      setIsBookmarked((prev) => !prev)
      router.refresh()
    } catch (error) {
      console.error('Error bookmarking:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleBookmark}
      disabled={isLoading}
      className="group relative inline-flex items-center gap-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark this article'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className={`w-5 h-5 transition-transform duration-200 ${
          isBookmarked ? 'scale-110' : 'scale-100 group-hover:scale-110'
        }`}
      >
        <path
          fillRule="evenodd"
          d="M10 2c-1.716 0-3.408.106-5.07.31C3.806 2.45 3 3.414 3 4.517V17.25a.75.75 0 001.075.676L10 15.082l5.925 2.844A.75.75 0 0017 17.25V4.517c0-1.103-.806-2.068-1.93-2.207A41.403 41.403 0 0010 2z"
          clipRule="evenodd"
          className={isBookmarked ? 'fill-current' : 'fill-none stroke-current stroke-2'}
        />
      </svg>
      {isLoading && (
        <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      )}
    </button>
  )
}
