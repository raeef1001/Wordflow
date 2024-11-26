'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { FiEdit2, FiTrash2, FiEye, FiArchive } from 'react-icons/fi'

interface Article {
  id: string
  title: string
  slug: string
  status: string
  views: number
  createdAt: string
  _count: {
    comments: number
    claps: number
  }
}

export default function ArticlesPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingArticleId, setDeletingArticleId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user) {
      router.push('/auth/signin')
      return
    }

    const fetchArticles = async () => {
      try {
        const response = await fetch('/api/articles/user')
        if (!response.ok) {
          throw new Error('Failed to fetch articles')
        }
        const data = await response.json()
        setArticles(data.articles)
      } catch (error) {
        console.error('Error fetching articles:', error)
        toast.error('Failed to load articles')
      } finally {
        setIsLoading(false)
      }
    }

    fetchArticles()
  }, [session, status, router])

  const handleStatusChange = async (articleId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update article status')
      }

      setArticles((prevArticles) =>
        prevArticles.map((article) =>
          article.id === articleId ? { ...article, status: newStatus } : article
        )
      )
      toast.success('Article status updated')
    } catch (error) {
      console.error('Error updating article status:', error)
      toast.error('Failed to update article status')
    }
  }

  const handleDelete = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return

    setDeletingArticleId(articleId)
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Failed to delete article')
      }

      setArticles((prevArticles) => 
        prevArticles.filter((article) => article.id !== articleId)
      )
      toast.success('Article deleted successfully')
      router.refresh() // Refresh the page to update any cached data
    } catch (error) {
      console.error('Error deleting article:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete article')
    } finally {
      setDeletingArticleId(null)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout activeTab="articles">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout activeTab="articles">
      <div className="space-y-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Your Articles</h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              Manage your articles, track engagement, and update their status.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              href="/write"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto transition-colors"
            >
              Write new article
            </Link>
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No articles yet. Start writing your first article!</p>
          </div>
        ) : (
          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 sm:pl-6">
                          Title
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                          Status
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                          Views
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                          Engagement
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                      {articles.map((article) => (
                        <tr key={article.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="flex items-center">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">{article.title}</div>
                                <div className="text-gray-500 dark:text-gray-400">
                                  {new Date(article.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            <select
                              value={article.status}
                              onChange={(e) => handleStatusChange(article.id, e.target.value)}
                              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 bg-transparent"
                            >
                              <option value="DRAFT">Draft</option>
                              <option value="PUBLISHED">Published</option>
                              <option value="ARCHIVED">Archived</option>
                            </select>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {article.views}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-4">
                              <span>{article._count.claps} claps</span>
                              <span>{article._count.comments} comments</span>
                            </div>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/article/${article.slug}`}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              >
                                <FiEye className="w-5 h-5" />
                              </Link>
                              <Link
                                href={`/write?edit=${article.id}`}
                                className="text-blue-500 hover:text-blue-600"
                              >
                                <FiEdit2 className="w-5 h-5" />
                              </Link>
                              <button
                                onClick={() => handleDelete(article.id)}
                                disabled={deletingArticleId === article.id}
                                className="text-red-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingArticleId === article.id ? (
                                  <span className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin inline-block" />
                                ) : (
                                  <FiTrash2 className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
