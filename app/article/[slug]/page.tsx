import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { ClapButton } from '@/components/ClapButton'
import { CommentSection } from '@/components/CommentSection'
import Image from 'next/image'

async function getArticle(slug: string) {
  const article = await prisma.article.findUnique({
    where: { slug },
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

  if (!article) {
    notFound()
  }

  return article
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string }
}) {
  const article = await getArticle(params.slug)

  return (
    <article className="max-w-4xl mx-auto p-6">
      <header className="mb-8">
        {article.coverImage && (
          <div className="relative w-full aspect-[2/1] mb-8 rounded-lg overflow-hidden">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
        <div className="flex items-center gap-4 text-gray-600">
          <div className="flex items-center gap-2">
            {article.author.image ? (
              <img
                src={article.author.image}
                alt={article.author.name || ''}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200" />
            )}
            <div>
              <Link
                href={`/profile/${article.author.id}`}
                className="font-medium text-gray-900 hover:underline"
              >
                {article.author.name || article.author.email}
              </Link>
              <p className="text-sm">
                {format(new Date(article.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span>{article._count.claps} claps</span>
            <span>·</span>
            <span>{article._count.comments} comments</span>
          </div>
        </div>
      </header>

      <div className="prose max-w-none mb-8">
        <ReactMarkdown>{article.content}</ReactMarkdown>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {article.tags.map((tag) => (
          <Link
            key={tag.id}
            href={`/?tag=${tag.name}`}
            className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 hover:bg-gray-200"
          >
            {tag.name}
          </Link>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-8">
        <ClapButton articleId={article.id} initialClaps={article._count.claps} />
        <CommentSection
          articleId={article.id}
          initialComments={article._count.comments}
        />
      </div>
    </article>
  )
}
