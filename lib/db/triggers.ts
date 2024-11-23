import { prisma } from '@/lib/prisma'
import { Clap, Comment, ReadHistory } from '@prisma/client'

export async function handleClapCreated(clap: Clap) {
  try {
    // Get the current article
    const article = await prisma.article.findUnique({
      where: { id: clap.articleId },
      select: {
        metadata: true
      }
    })

    if (!article) return

    // Parse the current metadata
    const metadata = article.metadata ? JSON.parse(article.metadata) : {}
    
    // Update the clap count
    metadata.totalClaps = (metadata.totalClaps || 0) + clap.count

    // Update the article
    await prisma.article.update({
      where: { id: clap.articleId },
      data: {
        metadata: JSON.stringify(metadata)
      }
    })

    // Update user statistics
    await prisma.user.update({
      where: { id: clap.userId },
      data: {
        totalClaps: {
          increment: clap.count
        }
      }
    })
  } catch (error) {
    console.error('Error handling clap creation:', error)
  }
}

export async function handleCommentCreated(comment: Comment) {
  try {
    // Get the current article
    const article = await prisma.article.findUnique({
      where: { id: comment.articleId },
      select: {
        metadata: true
      }
    })

    if (!article) return

    // Parse the current metadata
    const metadata = article.metadata ? JSON.parse(article.metadata) : {}
    
    // Update the comment count
    metadata.totalComments = (metadata.totalComments || 0) + 1

    // Update the article
    await prisma.article.update({
      where: { id: comment.articleId },
      data: {
        metadata: JSON.stringify(metadata)
      }
    })
  } catch (error) {
    console.error('Error handling comment creation:', error)
  }
}

export async function handleReadHistoryCreated(readHistory: ReadHistory) {
  try {
    // Get the current article
    const article = await prisma.article.findUnique({
      where: { id: readHistory.articleId },
      select: {
        metadata: true
      }
    })

    if (!article) return

    // Parse the current metadata
    const metadata = article.metadata ? JSON.parse(article.metadata) : {}
    
    // Update the views count
    metadata.views = (metadata.views || 0) + 1

    // If read history is completed, update the reads count
    if (readHistory.completed) {
      metadata.totalReads = (metadata.totalReads || 0) + 1
    }

    // Update the article
    await prisma.article.update({
      where: { id: readHistory.articleId },
      data: {
        metadata: JSON.stringify(metadata)
      }
    })

    // Update user statistics
    if (readHistory.completed) {
      await prisma.user.update({
        where: { id: readHistory.userId },
        data: {
          totalReads: {
            increment: 1
          }
        }
      })
    }
  } catch (error) {
    console.error('Error handling read history creation:', error)
  }
}
