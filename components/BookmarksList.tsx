'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

interface BookmarksListProps {
  bookmarks: Array<{
    id: string
    createdAt: string
    article: {
      id: string
      title: string
      slug: string
      coverImage: string | null
      createdAt: string
      author: {
        name: string | null
        image: string | null
      }
      _count: {
        claps: number
        comments: number
      }
    }
  }>
}

export function BookmarksList({ bookmarks }: BookmarksListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleRemoveBookmark = async (bookmarkId: string) => {
    try {
      setRemovingId(bookmarkId)
      const response = await fetch(`/api/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove bookmark')
      }
    } catch (error) {
      console.error('Error removing bookmark:', error)
    }
  }

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {bookmarks.map((bookmark) => (
          <motion.div
            key={bookmark.id}
            initial={{ opacity: 1, height: 'auto' }}
            exit={{
              opacity: 0,
              height: 0,
              marginTop: 0,
              marginBottom: 0,
              overflow: 'hidden',
            }}
            transition={{ duration: 0.2 }}
            className="group relative bg-white dark:bg-gray-800/30 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <Link
              href={`/article/${bookmark.article.slug}`}
              className="block p-6"
            >
              <div className="flex gap-6">
                {bookmark.article.coverImage && (
                  <div className="relative w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={bookmark.article.coverImage}
                      alt={bookmark.article.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {bookmark.article.author.image && (
                      <Image
                        src={bookmark.article.author.image}
                        alt={bookmark.article.author.name || ''}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    )}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {bookmark.article.author.name}
                    </span>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <time className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(bookmark.article.createdAt), 'MMM d, yyyy')}
                    </time>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                    {bookmark.article.title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path d="M1 8.25a1.25 1.25 0 112.5 0v7.5a1.25 1.25 0 11-2.5 0v-7.5zM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0114 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 01-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 01-1.341-.317l-2.734-1.366A3 3 0 006.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 012.166-1.73c.432-.143.853-.386 1.011-.814.16-.432.248-.9.248-1.388z" />
                      </svg>
                      <span>{bookmark.article._count.claps}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902 1.168.188 2.352.327 3.55.414.28.02.521.18.642.413l1.713 3.293a.75.75 0 001.33 0l1.713-3.293a.783.783 0 01.642-.413 41.102 41.102 0 003.55-.414c1.437-.232 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2zM6.75 6a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 2.5a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{bookmark.article._count.comments}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <time className="text-sm">
                        {format(new Date(bookmark.createdAt), 'MMM d')}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
            <button
              onClick={() => handleRemoveBookmark(bookmark.id)}
              disabled={removingId === bookmark.id}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors duration-200"
              title="Remove bookmark"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
