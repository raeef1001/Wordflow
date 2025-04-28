import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth/config';

/**
 * GET /api/articles/[articleId]/analytics
 * 
 * Retrieves analytics data for a specific article
 * Only the article author or admin users can access this data
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { articleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { articleId } = params;

    // Get the article with author info
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        title: true,
        slug: true,
        authorId: true,
        views: true,
        createdAt: true,
        publishedAt: true,
        author: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Check if user is authorized (article author or admin)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isAuthor = article.authorId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get article analytics
    const analytics = await prisma.articleAnalytics.findUnique({
      where: { articleId }
    });

    // Get read history statistics
    const readHistories = await prisma.readHistory.findMany({
      where: { articleId },
      select: {
        readTime: true,
        progress: true,
        completed: true,
        createdAt: true
      }
    });

    // Get comment count
    const commentCount = await prisma.comment.count({
      where: { articleId }
    });

    // Get clap statistics
    const claps = await prisma.clap.findMany({
      where: { articleId },
      select: {
        count: true,
        createdAt: true
      }
    });

    const totalClaps = claps.reduce((sum, clap) => sum + clap.count, 0);
    const uniqueClappers = claps.length;

    // Get bookmark count
    const bookmarkCount = await prisma.bookmark.count({
      where: { articleId }
    });

    // Calculate engagement metrics
    const engagementScore = calculateEngagementScore({
      views: article.views,
      readCount: readHistories.length,
      commentCount,
      clapCount: totalClaps,
      bookmarkCount
    });

    // Prepare response data
    const analyticsData = {
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        createdAt: article.createdAt,
        publishedAt: article.publishedAt
      },
      views: {
        total: article.views,
        unique: analytics?.uniqueViews || 0
      },
      readMetrics: {
        totalReads: readHistories.length,
        averageReadTime: analytics?.averageReadTime || 0,
        completionRate: analytics?.completionRate || 0,
        readTimeDistribution: calculateReadTimeDistribution(readHistories)
      },
      engagement: {
        comments: commentCount,
        claps: {
          total: totalClaps,
          uniqueClappers
        },
        bookmarks: bookmarkCount,
        engagementScore
      },
      referrals: analytics?.referralSources 
        ? JSON.parse(analytics.referralSources)
        : {},
      devices: analytics?.deviceBreakdown
        ? JSON.parse(analytics.deviceBreakdown)
        : {},
      geography: analytics?.geographicData
        ? JSON.parse(analytics.geographicData)
        : {},
      timeSeriesData: generateTimeSeriesData(article, readHistories, claps)
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error fetching article analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article analytics' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to calculate engagement score
 */
function calculateEngagementScore({
  views,
  readCount,
  commentCount,
  clapCount,
  bookmarkCount
}: {
  views: number;
  readCount: number;
  commentCount: number;
  clapCount: number;
  bookmarkCount: number;
}) {
  // Simple weighted scoring algorithm
  // These weights can be adjusted based on what's considered most valuable
  const weights = {
    views: 1,
    reads: 3,
    comments: 5,
    claps: 2,
    bookmarks: 4
  };

  // Prevent division by zero
  if (views === 0) return 0;

  // Calculate normalized metrics (as percentage of views)
  const readRate = readCount / views;
  const commentRate = commentCount / views;
  const clapRate = clapCount / views;
  const bookmarkRate = bookmarkCount / views;

  // Calculate weighted score
  const score = 
    (readRate * weights.reads) +
    (commentRate * weights.comments) +
    (clapRate * weights.claps) +
    (bookmarkRate * weights.bookmarks);

  // Scale to 0-100 range
  return Math.min(100, Math.round(score * 100));
}

/**
 * Helper function to calculate read time distribution
 */
function calculateReadTimeDistribution(readHistories: { readTime: number }[]) {
  const distribution = {
    '0-30s': 0,
    '30s-1m': 0,
    '1m-3m': 0,
    '3m-5m': 0,
    '5m-10m': 0,
    '10m+': 0
  };

  readHistories.forEach(history => {
    const readTimeSeconds = history.readTime;
    
    if (readTimeSeconds < 30) {
      distribution['0-30s']++;
    } else if (readTimeSeconds < 60) {
      distribution['30s-1m']++;
    } else if (readTimeSeconds < 180) {
      distribution['1m-3m']++;
    } else if (readTimeSeconds < 300) {
      distribution['3m-5m']++;
    } else if (readTimeSeconds < 600) {
      distribution['5m-10m']++;
    } else {
      distribution['10m+']++;
    }
  });

  return distribution;
}

/**
 * Helper function to generate time series data for charts
 */
function generateTimeSeriesData(
  article: { createdAt: Date; publishedAt: Date | null; views: number },
  readHistories: { createdAt: Date }[],
  claps: { createdAt: Date }[]
) {
  // Get the date range (last 30 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  // Initialize data structure
  const timeSeriesData: Record<string, { views: number; reads: number; claps: number }> = {};

  // Populate with dates
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    timeSeriesData[dateStr] = { views: 0, reads: 0, claps: 0 };
  }

  // We don't have daily view data in this implementation, so we'll just
  // distribute the total views evenly across the days since publication
  if (article.publishedAt) {
    const pubDate = new Date(article.publishedAt);
    const daysSincePublication = Math.max(1, Math.floor((endDate.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Only distribute views across days that are in our time range
    const startDistributionDate = pubDate > startDate ? pubDate : startDate;
    const daysInRange = Math.floor((endDate.getTime() - startDistributionDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Simple even distribution (in a real app, you'd have actual daily view data)
    const viewsPerDay = Math.floor(article.views / daysInRange);
    
    for (let d = new Date(startDistributionDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (timeSeriesData[dateStr]) {
        timeSeriesData[dateStr].views = viewsPerDay;
      }
    }
  }

  // Add read data
  readHistories.forEach(history => {
    const dateStr = history.createdAt.toISOString().split('T')[0];
    if (timeSeriesData[dateStr]) {
      timeSeriesData[dateStr].reads++;
    }
  });

  // Add clap data
  claps.forEach(clap => {
    const dateStr = clap.createdAt.toISOString().split('T')[0];
    if (timeSeriesData[dateStr]) {
      timeSeriesData[dateStr].claps++;
    }
  });

  // Convert to array format for easier charting
  return Object.entries(timeSeriesData).map(([date, data]) => ({
    date,
    ...data
  }));
}
