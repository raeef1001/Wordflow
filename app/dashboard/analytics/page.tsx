import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AnalyticsCard } from '@/components/analytics/AnalyticsCard'
import { EngagementChart } from '@/components/analytics/EngagementChart'
import { TopArticles } from '@/components/analytics/TopArticles'
import { format } from 'date-fns'

async function getAnalytics(userId: string) {
  const [
    totalArticles,
    totalClaps,
    totalComments,
    totalBookmarks,
    recentArticles,
    topArticles
  ] = await Promise.all([
    // Get total articles
    prisma.article.count({
      where: { authorId: userId }
    }),
    // Get total claps
    prisma.clap.count({
      where: {
        article: { authorId: userId }
      }
    }),
    // Get total comments
    prisma.comment.count({
      where: {
        article: { authorId: userId }
      }
    }),
    // Get total bookmarks
    prisma.bookmark.count({
      where: {
        article: { authorId: userId },
        deletedAt: null
      }
    }),
    // Get recent articles with engagement metrics
    prisma.article.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 30, // Increased to show more data points
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        _count: {
          select: {
            claps: true,
            comments: true,
            bookmarks: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      }
    }),
    // Get top performing articles
    prisma.article.findMany({
      where: { authorId: userId },
      orderBy: {
        claps: {
          _count: 'desc'
        }
      },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        _count: {
          select: {
            claps: true,
            comments: true,
            bookmarks: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      }
    })
  ])

  // Transform dates to ISO strings for serialization
  const serializedRecentArticles = recentArticles.map(article => ({
    ...article,
    createdAt: article.createdAt.toISOString()
  }))

  const serializedTopArticles = topArticles.map(article => ({
    ...article,
    createdAt: article.createdAt.toISOString()
  }))

  return {
    totalArticles,
    totalClaps,
    totalComments,
    totalBookmarks,
    recentArticles: serializedRecentArticles,
    topArticles: serializedTopArticles
  }
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login')
  }

  const stats = await getAnalytics(session.user.id)

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Total Articles"
          value={stats.totalArticles}
          icon="📝"
        />
        <AnalyticsCard
          title="Total Claps"
          value={stats.totalClaps}
          icon="👏"
        />
        <AnalyticsCard
          title="Total Comments"
          value={stats.totalComments}
          icon="💬"
        />
        <AnalyticsCard
          title="Total Bookmarks"
          value={stats.totalBookmarks}
          icon="🔖"
        />
      </div>

      {/* Engagement Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Engagement Over Time</h2>
        <EngagementChart articles={stats.recentArticles} />
      </div>

      {/* Top Articles */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Top Performing Articles</h2>
        <TopArticles articles={stats.topArticles} />
      </div>
    </div>
  )
}
