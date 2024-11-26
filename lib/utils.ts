export function getReadingTime(content: string): number {
  const wordsPerMinute = 200; // Average reading speed
  const wordCount = content.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return readingTime;
}

export function parseSettings(settings: string | null): Record<string, any> {
  if (!settings) return {};
  try {
    return JSON.parse(settings);
  } catch {
    return {};
  }
}

export function stringifySettings(settings: Record<string, any>): string {
  return JSON.stringify(settings);
}

export function calculateArticleSimilarity(
  article1Tags: string[],
  article1Categories: string[],
  article2Tags: string[],
  article2Categories: string[],
): number {
  const tagOverlap = article1Tags.filter(tag => article2Tags.includes(tag)).length;
  const categoryOverlap = article1Categories.filter(cat => article2Categories.includes(cat)).length;
  
  // Weight tag similarity slightly higher than category similarity
  const tagSimilarity = tagOverlap / Math.max(article1Tags.length, article2Tags.length, 1) * 0.6;
  const categorySimilarity = categoryOverlap / Math.max(article1Categories.length, article2Categories.length, 1) * 0.4;
  
  return tagSimilarity + categorySimilarity;
}

export function generateSearchQuery(
  query: string,
  filters: {
    authors?: string[];
    categories?: string[];
    tags?: string[];
    dateRange?: { start: Date; end: Date };
  },
) {
  const searchConditions: any[] = [
    {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
      ],
    },
  ];

  if (filters.authors?.length) {
    searchConditions.push({
      author: {
        id: { in: filters.authors },
      },
    });
  }

  if (filters.categories?.length) {
    searchConditions.push({
      categories: {
        some: {
          category: {
            id: { in: filters.categories },
          },
        },
      },
    });
  }

  if (filters.tags?.length) {
    searchConditions.push({
      tags: {
        some: {
          tag: {
            id: { in: filters.tags },
          },
        },
      },
    });
  }

  if (filters.dateRange) {
    searchConditions.push({
      createdAt: {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      },
    });
  }

  return {
    AND: searchConditions,
  };
}

export function getUserRecommendations(
  userInterests: Array<{ interest: string; weight: number }>,
  recentlyViewed: string[],
  limit = 10,
) {
  return {
    where: {
      id: { notIn: recentlyViewed },
      OR: [
        {
          tags: {
            some: {
              tag: {
                name: {
                  in: userInterests.map(i => i.interest),
                },
              },
            },
          },
        },
        {
          categories: {
            some: {
              category: {
                name: {
                  in: userInterests.map(i => i.interest),
                },
              },
            },
          },
        },
      ],
    },
    orderBy: [
      { views: 'desc' },
      { createdAt: 'desc' },
    ],
    take: limit,
  };
}
