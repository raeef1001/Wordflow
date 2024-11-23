import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { FiTrendingUp, FiBookmark, FiClock, FiFeather, FiMessageSquare } from 'react-icons/fi'

async function getArticles() {
  try {
    const articles = await prisma.article.findMany({
      where: { 
        status: "PUBLISHED",
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        excerpt: true,
        createdAt: true,
        author: {
          select: {
            name: true,
            image: true,
          },
        },
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            claps: true,
            comments: true,
          },
        },
      },
    })
    return articles
  } catch (error) {
    console.error('Error fetching articles:', error)
    return []
  }
}

async function getFeaturedArticles() {
  try {
    const articles = await prisma.article.findMany({
      where: { 
        status: "PUBLISHED",
        featured: true,
        deletedAt: null
      },
      take: 3,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        createdAt: true,
        author: {
          select: {
            name: true,
            image: true,
          },
        },
        tags: {
          select: {
            tag: true
          }
        },
        _count: {
          select: {
            comments: true,
            claps: true,
          },
        },
      },
    })
    return articles
  } catch (error) {
    console.error('Error fetching featured articles:', error)
    return []
  }
}

export default async function HomePage() {
  const [articles, featuredArticles] = await Promise.all([
    getArticles(),
    getFeaturedArticles().catch(() => []),
  ])

  return (
    <main>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/90 to-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Where good ideas find you
              </h1>
              <p className="text-xl mb-8 opacity-90">
                Read and share new perspectives on just about any topic. Everyone's welcome.{' '}
                <span className="font-medium">Get started writing today.</span>
              </p>
              <Link
                href="/write"
                className="inline-flex items-center px-6 py-3 bg-background text-primary rounded-full text-lg font-medium hover:bg-muted/80 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <FiFeather className="mr-2" />
                Start Writing
              </Link>
            </div>
            <div className="hidden lg:block relative">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-background/10 to-background/5 rounded-lg transform -rotate-6"></div>
              <div className="relative bg-background/10 backdrop-blur-lg rounded-lg p-8 shadow-xl">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-background/20"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-background/20 rounded w-3/4"></div>
                        <div className="h-3 bg-background/20 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <section className="bg-muted/30 dark:bg-background py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8 flex items-center text-foreground">
              <FiTrendingUp className="mr-2" />
              Featured Stories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/article/${article.slug}`}
                  className="group"
                >
                  <article className="bg-card dark:bg-card/50 backdrop-blur-sm rounded-xl border border-border shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
                    <div className="relative aspect-[2/1]">
                      {article.coverImage ? (
                        <Image
                          src={article.coverImage}
                          alt={article.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground">No image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors duration-200">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-muted-foreground mb-4 line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <FiClock className="mr-1" />
                            {format(new Date(article.createdAt), 'MMM d')}
                          </span>
                          <span>{article._count.claps} claps</span>
                        </div>
                        <FiBookmark className="group-hover:text-primary transition-colors duration-200" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Articles Grid */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">Latest Stories</h2>
            <div className="flex space-x-2">
              {['All', 'Technology', 'Design', 'Business'].map((category) => (
                <button
                  key={category}
                  className="px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <article
                key={article.id}
                className="group bg-card dark:bg-card/50 backdrop-blur-sm rounded-xl border border-border shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                <Link href={`/article/${article.slug}`}>
                  <div className="relative aspect-[2/1]">
                    {article.coverImage ? (
                      <Image
                        src={article.coverImage}
                        alt={article.title}
                        fill
                        className="object-cover transform group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-muted-foreground mb-4 line-clamp-2">{article.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {article.author.image ? (
                          <img
                            src={article.author.image}
                            alt={article.author.name || ''}
                            className="w-6 h-6 rounded-full ring-1 ring-border"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-muted ring-1 ring-border" />
                        )}
                        <span>{article.author.name}</span>
                      </div>
                      <span>{format(new Date(article.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FiBookmark className="w-4 h-4" />
                        {article._count.claps} claps
                      </span>
                      <span className="flex items-center gap-1">
                        <FiMessageSquare className="w-4 h-4" />
                        {article._count.comments} comments
                      </span>
                      <div className="flex gap-2">
                        {article.tags.map((tag) => (
                          <span
                            key={tag.tag.id}
                            className="px-2 py-1 bg-muted rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                          >
                            {tag.tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
