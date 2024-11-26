import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma, Prisma } from '@/lib/prisma'
import slugify from 'slugify'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { title, content, tags, coverImage } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { message: 'Title and content are required' },
        { status: 400 }
      )
    }

    const slug = slugify(title, { lower: true })

    // Check if slug already exists
    const existingArticle = await prisma.article.findUnique({
      where: { slug },
    })

    // If slug exists, append a random string
    const finalSlug = existingArticle 
      ? `${slug}-${Math.random().toString(36).substring(2, 8)}`
      : slug

    const article = await prisma.article.create({
      data: {
        title,
        content,
        slug: finalSlug,
        coverImage,
        status: "PUBLISHED",
        authorId: session.user.id,
        tags: {
          create: tags.map((tag: string) => ({
            tag: {
              connectOrCreate: {
                where: { name: tag },
                create: { 
                  name: tag,
                  slug: slugify(tag, { lower: true })
                }
              }
            }
          }))
        }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        tags: {
          include: {
            tag: true
          }
        }
      },
    })

    return NextResponse.json(article)
  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json(
      { message: 'Error creating article' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tag = searchParams.get('tag')
  const authorId = searchParams.get('author')

  const where: Prisma.ArticleWhereInput = {
    ...(authorId && { authorId }),
    ...(tag && {
      tags: {
        some: {
          tag: {
            name: tag
          }
        }
      }
    }),
    status: "PUBLISHED"
  }

  try {
    const articles = await prisma.article.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        tags: true,
        _count: {
          select: {
            comments: true,
            claps: true,
          },
        },
      },
    })

    return NextResponse.json(articles)
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { message: 'Error fetching articles' },
      { status: 500 }
    )
  }
}
