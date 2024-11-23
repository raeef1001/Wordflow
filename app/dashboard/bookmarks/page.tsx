import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth/config'
import { BookmarksList } from '@/components/BookmarksList'

async function getBookmarks(userId: string) {
  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    select: {
      id: true,
      createdAt: true,
      article: {
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          createdAt: true,
          author: {
            select: {
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              claps: true,
              comments: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Transform dates to ISO strings for serialization
  return bookmarks.map(bookmark => ({
    ...bookmark,
    createdAt: bookmark.createdAt.toISOString(),
    article: {
      ...bookmark.article,
      createdAt: bookmark.article.createdAt.toISOString(),
    }
  }))
}

export default async function BookmarksPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login')
  }

  const bookmarks = await getBookmarks(session.user.id)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
        Your Bookmarks
      </h1>

      {bookmarks.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No bookmarks yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start saving interesting articles for later
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Discover Articles
          </Link>
        </div>
      ) : (
        <BookmarksList bookmarks={bookmarks} />
      )}
    </div>
  )
}
