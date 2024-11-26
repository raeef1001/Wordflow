import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')
    const category = searchParams.get('category')

    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: session.user.id,
        ...(tag && {
          article: {
            tags: {
              some: {
                tag: {
                  name: tag
                }
              }
            }
          }
        }),
        ...(category && {
          article: {
            categories: {
              some: {
                category: {
                  name: category
                }
              }
            }
          }
        })
      },
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
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(bookmarks)
  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    return NextResponse.json(
      { message: 'Error fetching bookmarks' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { articleId } = await request.json()

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id: articleId }
    })

    if (!article) {
      return NextResponse.json(
        { message: 'Article not found' },
        { status: 404 }
      )
    }

    // Create or update bookmark
    const bookmark = await prisma.bookmark.upsert({
      where: {
        userId_articleId: {
          userId: session.user.id,
          articleId
        }
      },
      update: {},
      create: {
        userId: session.user.id,
        articleId,
        settings: JSON.stringify({
          addedAt: new Date(),
          source: 'manual'
        })
      },
      include: {
        article: {
          include: {
            tags: {
              include: {
                tag: true
              }
            }
          }
        }
      }
    })

    // Update user interests based on bookmarked article's tags
    const tagInterests = bookmark.article.tags.map(t => ({
      where: {
        userId_interest: {
          userId: session.user.id,
          interest: t.tag.name
        }
      },
      create: {
        userId: session.user.id,
        interest: t.tag.name,
        weight: 0.5,
        source: "BOOKMARK"
      },
      update: {
        weight: {
          increment: 0.5
        }
      }
    }))

    await Promise.all(
      tagInterests.map(interest =>
        prisma.userInterests.upsert(interest)
      )
    )

    return NextResponse.json(bookmark)
  } catch (error) {
    console.error('Error creating bookmark:', error)
    return NextResponse.json(
      { message: 'Error creating bookmark' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('articleId')

    if (!articleId) {
      return NextResponse.json(
        { message: 'Article ID is required' },
        { status: 400 }
      )
    }

    await prisma.bookmark.delete({
      where: {
        userId_articleId: {
          userId: session.user.id,
          articleId
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bookmark:', error)
    return NextResponse.json(
      { message: 'Error deleting bookmark' },
      { status: 500 }
    )
  }
}
