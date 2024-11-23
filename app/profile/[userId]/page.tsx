import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { FollowButton } from '@/components/FollowButton'

async function getProfile(userId: string) {
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      articles: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: 'desc' },
        include: {
          tags: {
            include: {
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
      },
      _count: {
        select: {
          articles: {
            where: { status: "PUBLISHED" },
          },
          followers: true,
          following: true,
        },
      },
    },
  })

  if (!profile) {
    notFound()
  }

  return profile
}

export default async function ProfilePage({
  params,
}: {
  params: { userId: string }
}) {
  const profile = await getProfile(params.userId)

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-12">
        <div className="flex items-center gap-6 mb-6">
          {profile.image ? (
            <Image
              src={profile.image}
              alt={profile.name || ''}
              width={120}
              height={120}
              className="rounded-full"
            />
          ) : (
            <div className="w-[120px] h-[120px] rounded-full bg-gray-200" />
          )}
          <div>
            <h1 className="text-3xl font-bold mb-2">{profile.name || 'Anonymous'}</h1>
            {profile.bio && <p className="text-gray-600 mb-4">{profile.bio}</p>}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>{profile._count.articles} articles</span>
              <span>{profile._count.followers} followers</span>
              <span>{profile._count.following} following</span>
            </div>
          </div>
          <div className="ml-auto">
            <FollowButton userId={profile.id} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {profile.articles.map((article) => (
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
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2 line-clamp-2">
                  {article.title}
                </h2>
                {article.excerpt && (
                  <p className="text-gray-600 mb-4 line-clamp-2">{article.excerpt}</p>
                )}
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <span>{article._count.claps} claps</span>
                  <span>{article._count.comments} comments</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {article.tags.map((tagRelation) => (
                    <span
                      key={tagRelation.tag.id}
                      className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
                    >
                      {tagRelation.tag.name}
                    </span>
                  ))}
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  {format(new Date(article.createdAt), 'MMM d, yyyy')}
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}
