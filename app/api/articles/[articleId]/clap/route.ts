import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: { articleId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: {
        id: params.articleId,
      },
    })

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Check if user has already clapped for this article
    const existingClap = await prisma.clap.findUnique({
      where: {
        articleId_userId: {
          articleId: params.articleId,
          userId: session.user.id,
        },
      },
    })

    if (existingClap) {
      // If user has already clapped, remove the clap (unlike)
      await prisma.clap.delete({
        where: {
          id: existingClap.id,
        },
      })
    } else {
      // If user hasn't clapped, create a new clap
      await prisma.clap.create({
        data: {
          articleId: params.articleId,
          userId: session.user.id,
        },
      })
    }

    // Get updated clap count
    const clapsCount = await prisma.clap.count({
      where: {
        articleId: params.articleId,
        deletedAt: null,
      },
    })

    return NextResponse.json({ claps: clapsCount })
  } catch (error) {
    console.error('Error handling clap:', error)
    return NextResponse.json(
      { error: 'Failed to handle clap' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { articleId: string } }
) {
  try {
    const clapsCount = await prisma.clap.count({
      where: {
        articleId: params.articleId,
        deletedAt: null,
      },
    })

    return NextResponse.json({ claps: clapsCount })
  } catch (error) {
    console.error('Error fetching claps:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claps' },
      { status: 500 }
    )
  }
}
