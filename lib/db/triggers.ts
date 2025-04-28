import { prisma } from '@/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Database triggers implementation for WordFlow
 * 
 * Since SQLite doesn't support native triggers, we implement them in code
 * These functions should be called after relevant database operations
 */

/**
 * Updates article analytics when an article is viewed
 */
export async function updateArticleAnalytics(articleId: string, userId?: string) {
  try {
    // Get the article
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { analytics: true }
    });

    if (!article) return;

    // Increment view count on the article
    await prisma.article.update({
      where: { id: articleId },
      data: { views: { increment: 1 } }
    });

    // If analytics record exists, update it
    if (article.analytics) {
      await prisma.articleAnalytics.update({
        where: { articleId },
        data: { 
          totalViews: { increment: 1 },
          // If we have a userId, we can track unique views more accurately
          uniqueViews: userId ? { increment: 1 } : undefined
        }
      });
    } else {
      // Create new analytics record if it doesn't exist
      await prisma.articleAnalytics.create({
        data: {
          articleId,
          totalViews: 1,
          uniqueViews: userId ? 1 : 0
        }
      });
    }

    // If we have a userId, update the author's total views
    if (article.authorId) {
      await prisma.user.update({
        where: { id: article.authorId },
        data: { totalViews: { increment: 1 } }
      });
    }
  } catch (error) {
    console.error('Error updating article analytics:', error);
  }
}

/**
 * Creates a notification when a user receives a clap
 */
export async function createClapNotification(clapId: string) {
  try {
    // Get the clap with article and user info
    const clap = await prisma.clap.findUnique({
      where: { id: clapId },
      include: { 
        article: true,
        user: true
      }
    });

    if (!clap || clap.article.authorId === clap.userId) return; // Don't notify if author clapped their own article

    // Create notification for the article author
    await prisma.notification.create({
      data: {
        userId: clap.article.authorId,
        type: 'CLAP',
        title: 'New Clap on Your Article',
        message: `${clap.user.name || 'Someone'} clapped for your article "${clap.article.title}"`,
        link: `/article/${clap.article.slug}`,
        metadata: JSON.stringify({
          articleId: clap.articleId,
          clapCount: clap.count,
          clapperId: clap.userId
        })
      }
    });
  } catch (error) {
    console.error('Error creating clap notification:', error);
  }
}

/**
 * Creates a notification when a user receives a comment
 */
export async function createCommentNotification(commentId: string) {
  try {
    // Get the comment with article and user info
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { 
        article: true,
        author: true,
        parent: {
          include: {
            author: true
          }
        }
      }
    });

    if (!comment) return;

    // If it's a reply to another comment, notify that comment's author
    if (comment.parentId && comment.parent && comment.parent.authorId !== comment.authorId) {
      await prisma.notification.create({
        data: {
          userId: comment.parent.authorId,
          type: 'REPLY',
          title: 'New Reply to Your Comment',
          message: `${comment.author.name || 'Someone'} replied to your comment on "${comment.article.title}"`,
          link: `/article/${comment.article.slug}#comment-${commentId}`,
          metadata: JSON.stringify({
            articleId: comment.articleId,
            commentId: commentId,
            parentCommentId: comment.parentId
          })
        }
      });
    }
    
    // Notify the article author (if not the commenter)
    if (comment.article.authorId !== comment.authorId) {
      await prisma.notification.create({
        data: {
          userId: comment.article.authorId,
          type: 'COMMENT',
          title: 'New Comment on Your Article',
          message: `${comment.author.name || 'Someone'} commented on your article "${comment.article.title}"`,
          link: `/article/${comment.article.slug}#comment-${commentId}`,
          metadata: JSON.stringify({
            articleId: comment.articleId,
            commentId: commentId
          })
        }
      });
    }
  } catch (error) {
    console.error('Error creating comment notification:', error);
  }
}

/**
 * Creates a notification when a user is followed
 */
export async function createFollowNotification(followerId: string, followingId: string) {
  try {
    // Get the follower info
    const follower = await prisma.user.findUnique({
      where: { id: followerId }
    });

    if (!follower) return;

    // Create notification for the followed user
    await prisma.notification.create({
      data: {
        userId: followingId,
        type: 'FOLLOW',
        title: 'New Follower',
        message: `${follower.name || 'Someone'} started following you`,
        link: `/profile/${followerId}`,
        metadata: JSON.stringify({
          followerId
        })
      }
    });
  } catch (error) {
    console.error('Error creating follow notification:', error);
  }
}

/**
 * Updates read history and analytics when an article is read
 */
export async function updateReadHistory(
  userId: string, 
  articleId: string, 
  readTime: number, 
  progress: number,
  completed: boolean
) {
  try {
    // Check if read history exists
    const existingHistory = await prisma.readHistory.findFirst({
      where: {
        userId,
        articleId
      }
    });

    if (existingHistory) {
      // Update existing read history
      await prisma.readHistory.update({
        where: { id: existingHistory.id },
        data: {
          readTime: readTime > existingHistory.readTime ? readTime : existingHistory.readTime,
          progress: progress > existingHistory.progress ? progress : existingHistory.progress,
          completed: completed || existingHistory.completed
        }
      });
    } else {
      // Create new read history
      await prisma.readHistory.create({
        data: {
          userId,
          articleId,
          readTime,
          progress,
          completed
        }
      });

      // Increment total reads for the author
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: { authorId: true }
      });

      if (article) {
        await prisma.user.update({
          where: { id: article.authorId },
          data: { totalReads: { increment: 1 } }
        });
      }
    }

    // Update article analytics
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { analytics: true }
    });

    if (article && article.analytics) {
      // Calculate new average read time
      const allReadHistories = await prisma.readHistory.findMany({
        where: { articleId }
      });
      
      const totalReadTime = allReadHistories.reduce((sum, history) => sum + history.readTime, 0);
      const averageReadTime = allReadHistories.length > 0 ? totalReadTime / allReadHistories.length : 0;
      
      // Calculate completion rate
      const completedReads = allReadHistories.filter(h => h.completed).length;
      const completionRate = allReadHistories.length > 0 ? completedReads / allReadHistories.length : 0;

      // Update analytics
      await prisma.articleAnalytics.update({
        where: { articleId },
        data: {
          averageReadTime,
          completionRate
        }
      });
    }
  } catch (error) {
    console.error('Error updating read history:', error);
  }
}

/**
 * Checks and awards achievements to users
 */
export async function checkAndAwardAchievements(userId: string) {
  try {
    // Get user with related data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        articles: true,
        claps: true,
        followers: true,
        achievements: {
          include: {
            achievement: true
          }
        }
      }
    });

    if (!user) return;

    // Get all achievements
    const allAchievements = await prisma.achievement.findMany();
    
    // Check each achievement
    for (const achievement of allAchievements) {
      // Skip if user already has this achievement
      if (user.achievements.some(ua => ua.achievementId === achievement.id)) {
        continue;
      }

      // Parse criteria
      const criteria = JSON.parse(achievement.criteria);
      let awarded = false;

      // Check different types of criteria
      if (criteria.type === 'ARTICLE_COUNT' && user.articles.length >= criteria.count) {
        awarded = true;
      } else if (criteria.type === 'FOLLOWER_COUNT' && user.followers.length >= criteria.count) {
        awarded = true;
      } else if (criteria.type === 'CLAP_COUNT' && user.totalClaps >= criteria.count) {
        awarded = true;
      }

      // Award achievement if criteria met
      if (awarded) {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id
          }
        });

        // Create notification
        await prisma.notification.create({
          data: {
            userId,
            type: 'ACHIEVEMENT',
            title: 'New Achievement Unlocked',
            message: `Congratulations! You've earned the "${achievement.name}" achievement`,
            metadata: JSON.stringify({
              achievementId: achievement.id,
              points: achievement.points
            })
          }
        });
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
}

/**
 * Creates a revision when an article is updated
 */
export async function createArticleRevision(articleId: string, title: string, content: string, excerpt?: string, changeLog?: string) {
  try {
    // Get current revision count
    const revisionCount = await prisma.articleRevision.count({
      where: { articleId }
    });

    // Create new revision
    await prisma.articleRevision.create({
      data: {
        articleId,
        version: revisionCount + 1,
        title,
        content,
        excerpt,
        changeLog
      }
    });
  } catch (error) {
    console.error('Error creating article revision:', error);
  }
}

/**
 * Updates user login statistics
 */
export async function updateUserLoginStats(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLogin: new Date(),
        loginCount: { increment: 1 }
      }
    });
  } catch (error) {
    console.error('Error updating user login stats:', error);
  }
}
