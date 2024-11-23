import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const authorId = searchParams.get('author')
    const tags = searchParams.getAll('tags[]')
    const categories = searchParams.getAll('categories[]')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const session = await getServerSession(authOptions)

    // Build search conditions
    const searchConditions = {
      AND: [
        {
          status: "PUBLISHED",
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
            { 
              author: {
                name: { contains: query, mode: 'insensitive' }
              }
            },
          ],
        },
        ...(authorId ? [{ authorId }] : []),
        ...(tags.length > 0 ? [{
          tags: {
            some: {
              tag: {
                name: { in: tags }
              }
            }
          }
        }] : []),
        ...(categories.length > 0 ? [{
          categories: {
            some: {
              category: {
                name: { in: categories }
              }
            }
          }
        }] : []),
        ...(startDate && endDate ? [{
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }] : [])
      ]
    }

    // Get search results
    const articles = await prisma.article.findMany({
      where: searchConditions,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        tags: {
          include: {
            tag: true
          }
        },
        categories: {
          include: {
            category: true
          }
        },
        _count: {
          select: {
            comments: true,
            claps: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Save search history if user is logged in
    if (session?.user?.id) {
      await prisma.searchHistory.create({
        data: {
          userId: session.user.id,
          query,
          filters: JSON.stringify({
            author: authorId,
            tags,
            categories,
            dateRange: startDate && endDate ? { startDate, endDate } : null
          }),
          results: articles.length
        }
      })

      // Update user interests based on search
      if (tags.length > 0 || categories.length > 0) {
        const interestUpdates = [
          ...tags.map(tag => ({
            where: {
              userId_interest: {
                userId: session.user.id,
                interest: tag
              }
            },
            create: {
              userId: session.user.id,
              interest: tag,
              weight: 0.2,
              source: "SEARCH"
            },
            update: {
              weight: {
                increment: 0.2
              }
            }
          })),
          ...categories.map(category => ({
            where: {
              userId_interest: {
                userId: session.user.id,
                interest: category
              }
            },
            create: {
              userId: session.user.id,
              interest: category,
              weight: 0.2,
              source: "SEARCH"
            },
            update: {
              weight: {
                increment: 0.2
              }
            }
          }))
        ]

        await Promise.all(
          interestUpdates.map(update =>
            prisma.userInterests.upsert(update)
          )
        )
      }
    }

    return NextResponse.json(articles)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { message: 'Error performing search' },
      { status: 500 }
    )
  }
}
