import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { FiEye, FiThumbsUp, FiMessageSquare, FiBookmark } from 'react-icons/fi'
import Link from 'next/link'

async function getStats(userId: string) {
  const [articles, totalViews, totalClaps, totalComments, bookmarks] = await Promise.all([
    prisma.article.count({
      where: { 
        authorId: userId,
        deletedAt: null 
      },
    }),
    prisma.article.aggregate({
      where: { 
        authorId: userId,
        deletedAt: null 
      },
      _sum: { views: true },
    }),
    prisma.clap.count({
      where: {
        article: { 
          authorId: userId,
          deletedAt: null 
        },
      },
    }),
    prisma.comment.count({
      where: {
        article: { 
          authorId: userId,
          deletedAt: null 
        },
      },
    }),
    prisma.bookmark.count({
      where: { 
        userId,
        article: {
          deletedAt: null
        }
      },
    }),
  ])

  return {
    articles,
    views: totalViews._sum.views || 0,
    claps: totalClaps,
    comments: totalComments,
    bookmarks,
  }
}

async function getRecentArticles(userId: string) {
  return prisma.article.findMany({
    where: { 
      authorId: userId,
      deletedAt: null,
      status: "PUBLISHED" // Only show published articles
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      _count: {
        select: {
          comments: true,
          claps: true,
        },
      },
    },
  })
}

export default async function DashboardPage() {
  const session = await getServerSession()
  if (!session?.user) {
    redirect('/login')
  }

  const [stats, recentArticles] = await Promise.all([
    getStats(session.user.id),
    getRecentArticles(session.user.id),
  ])

  const stats_items = [
    { name: 'Total Articles', stat: stats.articles, icon: FiMessageSquare },
    { name: 'Total Views', stat: stats.views, icon: FiEye },
    { name: 'Total Claps', stat: stats.claps, icon: FiThumbsUp },
    { name: 'Bookmarks', stat: stats.bookmarks, icon: FiBookmark },
  ]

  return (
    <DashboardLayout activeTab="overview">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats_items.map((item) => (
            <div
              key={item.name}
              className="relative bg-white dark:bg-gray-800 pt-5 px-4 pb-6 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
            >
              <div>
                <dt>
                  <div className="absolute bg-green-500 rounded-md p-3">
                    <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{item.name}</p>
                </dt>
                <dd className="ml-16 flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{item.stat}</p>
                </dd>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Articles */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Recent Articles</h3>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentArticles.map((article) => (
                <li key={article.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/article/${article.slug}`}
                        className="text-sm font-medium text-green-600 hover:text-green-700 hover:underline truncate"
                      >
                        {article.title}
                      </Link>
                      <p className="mt-1 flex text-sm text-gray-500 dark:text-gray-400">
                        <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                        <span className="mx-2">•</span>
                        <span>{article.status}</span>
                      </p>
                    </div>
                    <div className="flex space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <FiEye className="h-4 w-4" />
                        <span>{article.views}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiThumbsUp className="h-4 w-4" />
                        <span>{article._count.claps}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiMessageSquare className="h-4 w-4" />
                        <span>{article._count.comments}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
