'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export function ClapButton({
  articleId,
  initialClaps,
}: {
  articleId: string
  initialClaps: number
}) {
  const { data: session } = useSession()
  const [claps, setClaps] = useState(initialClaps)
  const [isClapping, setIsClapping] = useState(false)

  const handleClap = async () => {
    if (!session) {
      // Redirect to login or show login modal
      return
    }

    setIsClapping(true)
    try {
      const response = await fetch(`/api/articles/${articleId}/clap`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to clap')
      }

      const data = await response.json()
      setClaps(data.claps)
    } catch (error) {
      console.error('Failed to clap:', error)
    } finally {
      setIsClapping(false)
    }
  }

  return (
    <button
      onClick={handleClap}
      disabled={isClapping}
      className="group relative flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200">
        {claps}
      </span>
      {isClapping && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
      )}
    </button>
  )
}
