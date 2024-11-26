import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth/config'

export async function GET(
  request: Request,
  { params }: { params: { articleId: string } }
) {
  try {
    const article = await prisma.article.findUnique({
      where: { id: params.articleId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    if (!article) {
      return new NextResponse('Article not found', { status: 404 })
    }

    return NextResponse.json(article)
  } catch (error) {
    console.error('Error fetching article:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { articleId: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    const article = await prisma.article.findUnique({
      where: { id: params.articleId },
      include: { tags: true },
    })

    if (!article) {
      return new NextResponse('Article not found', { status: 404 })
    }

    if (article.authorId !== user.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const body = await request.json()
    const { title, content, coverImage, tags, status } = body

    // Create slug from title
    const slug = title
      ? title
          .toLowerCase()
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .replace(/\s+/g, '-')
      : article.slug

    // Update article
    const updatedArticle = await prisma.article.update({
      where: { id: params.articleId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(coverImage && { coverImage }),
        ...(slug && { slug }),
        ...(status && { status }),
        ...(tags && {
          tags: {
            deleteMany: {},
            create: tags.map((tagName: string) => ({
              tag: {
                connectOrCreate: {
                  where: { name: tagName },
                  create: {
                    name: tagName,
                    slug: tagName.toLowerCase().replace(/\s+/g, '-'),
                  },
                },
              },
            })),
          },
        }),
      },
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
            tag: true,
          },
        },
      },
    })

    return NextResponse.json(updatedArticle)
  } catch (error) {
    console.error('Error updating article:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { articleId: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    const article = await prisma.article.findUnique({
      where: { id: params.articleId },
    })

    if (!article) {
      return new NextResponse('Article not found', { status: 404 })
    }

    if (article.authorId !== user.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Delete related records first
    await prisma.$transaction([
      // Delete article tags
      prisma.tagsOnArticles.deleteMany({
        where: { articleId: params.articleId }
      }),
      // Delete article comments
      prisma.comment.deleteMany({
        where: { articleId: params.articleId }
      }),
      // Delete article claps
      prisma.clap.deleteMany({
        where: { articleId: params.articleId }
      }),
      // Finally delete the article
      prisma.article.delete({
        where: { id: params.articleId }
      })
    ])

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting article:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
