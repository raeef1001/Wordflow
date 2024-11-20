import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const { userId } = params

    // Ensure user can only access their own dashboard
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's articles with stats
    const articles = await prisma.article.findMany({
      where: {
        authorId: userId,
        status: "PUBLISHED"
      },
      include: {
        _count: {
          select: {
            comments: true,
            claps: true,
            readHistory: true,
          }
        }
      }
    })

    // Calculate total stats
    const stats = articles.reduce((acc, article) => ({
      totalClaps: acc.totalClaps + article._count.claps,
      totalComments: acc.totalComments + article._count.comments,
      totalReads: acc.totalReads + article._count.readHistory,
    }), {
      totalClaps: 0,
      totalComments: 0,
      totalReads: 0,
    })

    // Get user's top interests
    const topInterests = await prisma.userInterests.findMany({
      where: { userId },
      orderBy: { weight: 'desc' },
      take: 10,
    })

    // Get recent search history
    const searchHistory = await prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Get reading history with article details
    const readHistory = await prisma.readHistory.findMany({
      where: { userId },
      include: {
        article: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            },
            tags: {
              include: {
                tag: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Get bookmarked articles
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        article: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            },
            tags: {
              include: {
                tag: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Get follower/following counts
    const followCounts = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        _count: {
          select: {
            followers: true,
            following: true,
          }
        }
      }
    })

    // Get engagement trends (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentClaps = await prisma.clap.groupBy({
      by: ['createdAt'],
      where: {
        article: {
          authorId: userId
        },
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      _sum: {
        count: true
      }
    })

    const recentReads = await prisma.readHistory.groupBy({
      by: ['createdAt'],
      where: {
        article: {
          authorId: userId
        },
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      _count: true
    })

    return NextResponse.json({
      stats,
      articles,
      topInterests,
      searchHistory,
      readHistory,
      bookmarks,
      followCounts: followCounts?._count,
      engagementTrends: {
        claps: recentClaps,
        reads: recentReads
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { message: 'Error fetching dashboard data' },
      { status: 500 }
    )
  }
}
