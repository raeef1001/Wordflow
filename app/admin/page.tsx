import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'

async function getStats() {
  const [users, articles, comments, tags] = await Promise.all([
    prisma.user.count(),
    prisma.article.count(),
    prisma.comment.count(),
    prisma.tag.count(),
  ])

  return { users, articles, comments, tags }
}

async function getRecentArticles() {
  return prisma.article.findMany({
    take: 5,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      author: {
        select: {
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          comments: true,
          claps: true,
        },
      },
    },
  })
}

async function getPopularTags() {
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: {
          articles: true,
        },
      },
    },
    orderBy: {
      articles: {
        _count: 'desc',
      },
    },
    take: 10,
  })

  return tags
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/')
  }

  const [stats, recentArticles, popularTags] = await Promise.all([
    getStats(),
    getRecentArticles(),
    getPopularTags(),
  ])

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700">Total Users</h2>
          <p className="text-3xl font-bold">{stats.users}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700">Total Articles</h2>
          <p className="text-3xl font-bold">{stats.articles}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700">Total Comments</h2>
          <p className="text-3xl font-bold">{stats.comments}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700">Total Tags</h2>
          <p className="text-3xl font-bold">{stats.tags}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Recent Articles</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentArticles.map((article) => (
                  <tr key={article.id}>
                    <td className="px-6 py-4">
                      <Link
                        href={`/article/${article.slug}`}
                        className="text-blue-600 hover:underline"
                      >
                        {article.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {article.author.name || article.author.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(article.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {article._count.comments} comments · {article._count.claps}{' '}
                      claps
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Popular Tags</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-4">
              {popularTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between"
                >
                  <Link
                    href={`/?tag=${tag.name}`}
                    className="text-blue-600 hover:underline"
                  >
                    {tag.name}
                  </Link>
                  <span className="text-gray-500">
                    {tag._count.articles} articles
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
