import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { FiTrendingUp, FiBookmark, FiClock, FiFeather } from 'react-icons/fi'

async function getArticles() {
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: {
          name: true,
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
  return articles
}

async function getFeaturedArticles() {
  return prisma.article.findMany({
    where: { 
      status: "PUBLISHED",
    },
    take: 3,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      author: {
        select: {
          name: true,
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
}

export default async function HomePage() {
  const [articles, featuredArticles] = await Promise.all([
    getArticles(),
    getFeaturedArticles(),
  ])

  return (
    <main>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-400 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Where good ideas find you
              </h1>
              <p className="text-xl mb-8 text-green-50">
                Read and share new perspectives on just about any topic. Everyone's welcome.{' '}
                <span className="font-medium">Get started writing today.</span>
              </p>
              <Link
                href="/write"
                className="inline-flex items-center px-6 py-3 bg-white text-green-600 rounded-full text-lg font-medium hover:bg-green-50 transition-colors"
              >
                <FiFeather className="mr-2" />
                Start Writing
              </Link>
            </div>
            <div className="hidden lg:block relative">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-white/5 rounded-lg transform -rotate-6"></div>
              <div className="relative bg-white/20 backdrop-blur-lg rounded-lg p-8">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-white/30"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/30 rounded w-3/4"></div>
                        <div className="h-3 bg-white/30 rounded w-1/2"></div>
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
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8 flex items-center">
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
                  <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative aspect-[2/1]">
                      {article.coverImage ? (
                        <Image
                          src={article.coverImage}
                          alt={article.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-green-600 transition-colors">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <FiClock className="mr-1" />
                            {format(new Date(article.createdAt), 'MMM d')}
                          </span>
                          <span>{article._count.claps} claps</span>
                        </div>
                        <FiBookmark className="hover:text-green-600 transition-colors" />
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
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Latest Stories</h2>
            <div className="flex space-x-2">
              {['All', 'Technology', 'Design', 'Business'].map((category) => (
                <button
                  key={category}
                  className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
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
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <Link href={`/article/${article.slug}`}>
                  <div className="relative aspect-[2/1]">
                    {article.coverImage ? (
                      <Image
                        src={article.coverImage}
                        alt={article.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-2">{article.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        {article.author.image ? (
                          <img
                            src={article.author.image}
                            alt={article.author.name || ''}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200" />
                        )}
                        <span>{article.author.name}</span>
                      </div>
                      <span>{format(new Date(article.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                      <span>{article._count.claps} claps</span>
                      <span>{article._count.comments} comments</span>
                      <div className="flex gap-2">
                        {article.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 py-1 bg-gray-100 rounded-full text-xs"
                          >
                            {tag.name}
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
