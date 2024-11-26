'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function FollowButton({ userId }: { userId: string }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!session?.user) return

      try {
        const response = await fetch(`/api/users/${userId}/following`)
        if (response.ok) {
          const data = await response.json()
          setIsFollowing(data.following)
        }
      } catch (error) {
        console.error('Error checking follow status:', error)
      }
    }

    checkFollowStatus()
  }, [userId, session?.user])

  // Don't show the button if it's the current user's profile
  if (session?.user?.id === userId) {
    return null
  }

  // Don't show the button if user is not logged in
  if (!session?.user) {
    return null
  }

  const handleFollow = async () => {
    if (isLoading) return
    setIsLoading(true)

    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to follow user')
      }

      const data = await response.json()
      setIsFollowing(data.following)
      router.refresh()
    } catch (error) {
      console.error('Error following user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        isFollowing
          ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          : 'bg-green-600 hover:bg-green-700 text-white'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}
