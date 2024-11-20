import { PrismaClient } from '@prisma/client';
import { getReadingTime } from '../utils';

const prisma = new PrismaClient();

export const dbTriggers = {
  // Article triggers
  async beforeCreateArticle(data: any) {
    // Calculate reading time
    if (data.content) {
      data.readingTime = getReadingTime(data.content);
    }
    return data;
  },

  async afterCreateArticle(article: any) {
    // Update user statistics
    await prisma.user.update({
      where: { id: article.authorId },
      data: {
        totalReads: { increment: 0 },
        totalViews: { increment: 0 },
      },
    });

    // Generate initial related articles
    await updateRelatedArticles(article.id);
  },

  async beforeUpdateArticle(data: any) {
    // Recalculate reading time if content changed
    if (data.content) {
      data.readingTime = getReadingTime(data.content);
    }
    return data;
  },

  // Clap triggers
  async afterCreateClap(clap: any) {
    // Update article claps count
    await prisma.article.update({
      where: { id: clap.articleId },
      data: {
        settings: (article: any) => {
          const settings = article.settings ? JSON.parse(article.settings) : {};
          settings.totalClaps = (settings.totalClaps || 0) + clap.count;
          return JSON.stringify(settings);
        },
      },
    });

    // Update user statistics
    await prisma.user.update({
      where: { id: clap.userId },
      data: {
        totalClaps: { increment: clap.count },
      },
    });

    // Update user interests
    await updateUserInterests(clap.userId, clap.articleId, 0.5);
  },

  // Read history triggers
  async afterCreateReadHistory(readHistory: any) {
    if (readHistory.completed) {
      // Update article reads count
      await prisma.article.update({
        where: { id: readHistory.articleId },
        data: {
          reads: { increment: 1 },
        },
      });

      // Update user statistics
      await prisma.user.update({
        where: { id: readHistory.userId },
        data: {
          totalReads: { increment: 1 },
        },
      });

      // Update user interests
      await updateUserInterests(readHistory.userId, readHistory.articleId, 1.0);
    }
  },
};

// Utility functions
async function updateRelatedArticles(articleId: string) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      tags: true,
      categories: true,
    },
  });

  if (!article) return;

  // Find articles with similar tags and categories
  const relatedArticles = await prisma.article.findMany({
    where: {
      id: { not: articleId },
      OR: [
        {
          tags: {
            some: {
              tagId: {
                in: article.tags.map((t) => t.tagId),
              },
            },
          },
        },
        {
          categories: {
            some: {
              categoryId: {
                in: article.categories.map((c) => c.categoryId),
              },
            },
          },
        },
      ],
    },
    take: 10,
  });

  // Calculate similarity scores and create relationships
  for (const related of relatedArticles) {
    const score = calculateSimilarityScore(article, related);
    await prisma.relatedArticle.create({
      data: {
        articleId: article.id,
        relatedToId: related.id,
        score,
      },
    });
  }
}

async function updateUserInterests(userId: string, articleId: string, weight: number) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      tags: { include: { tag: true } },
      categories: { include: { category: true } },
    },
  });

  if (!article) return;

  // Update interests for tags
  for (const tagRelation of article.tags) {
    await prisma.userInterests.upsert({
      where: {
        id: `${userId}-${tagRelation.tag.name}`,
      },
      create: {
        userId,
        interest: tagRelation.tag.name,
        weight,
      },
      update: {
        weight: { increment: weight },
      },
    });
  }

  // Update interests for categories
  for (const categoryRelation of article.categories) {
    await prisma.userInterests.upsert({
      where: {
        id: `${userId}-${categoryRelation.category.name}`,
      },
      create: {
        userId,
        interest: categoryRelation.category.name,
        weight,
      },
      update: {
        weight: { increment: weight },
      },
    });
  }
}

function calculateSimilarityScore(article1: any, article2: any): number {
  let score = 0;

  // Calculate tag similarity
  const tags1 = new Set(article1.tags.map((t: any) => t.tagId));
  const tags2 = new Set(article2.tags.map((t: any) => t.tagId));
  const commonTags = new Set([...tags1].filter(x => tags2.has(x)));
  score += commonTags.size * 0.5;

  // Calculate category similarity
  const cats1 = new Set(article1.categories.map((c: any) => c.categoryId));
  const cats2 = new Set(article2.categories.map((c: any) => c.categoryId));
  const commonCats = new Set([...cats1].filter(x => cats2.has(x)));
  score += commonCats.size * 0.5;

  return score;
}

export default dbTriggers;
