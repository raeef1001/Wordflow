'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, redirect, useRouter } from 'next/navigation';
import { ClockIcon } from '@heroicons/react/24/outline';
import ArticleRevisionHistory from '@/components/articles/ArticleRevisionHistory';
import Link from 'next/link';

type Article = {
  id: string;
  title: string;
  slug: string;
  authorId: string;
};

export default function ArticleRevisionsPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      redirect('/auth/signin');
    }
    
    fetchArticle();
  }, [session, status, slug]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/articles?slug=${slug}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch article');
      }
      
      const data = await response.json();
      
      if (!data.articles || data.articles.length === 0) {
        throw new Error('Article not found');
      }
      
      const article = data.articles[0];
      setArticle(article);
      
      // Check if user is authorized (author or admin)
      const isAuthor = article.authorId === session?.user?.id;
      const isAdmin = session?.user?.role === 'ADMIN';
      
      if (!isAuthor && !isAdmin) {
        setError('You do not have permission to view revision history for this article');
      } else {
        setAuthorized(true);
      }
    } catch (err) {
      setError('Error loading article');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevisionRestore = () => {
    // Refresh the article after restoration
    router.refresh();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <Link href={`/article/${slug}`} className="block mt-2 underline">
            Return to article
          </Link>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Article not found. </strong>
          <Link href="/" className="underline">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link href={`/article/${slug}`} className="text-blue-600 hover:underline">
          &larr; Back to article
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center">
          <ClockIcon className="h-8 w-8 mr-2 text-blue-600" />
          Revision History for "{article.title}"
        </h1>
        <p className="text-gray-600 mt-2">
          View and restore previous versions of this article
        </p>
      </div>

      {authorized && (
        <div className="mb-8">
          <ArticleRevisionHistory 
            articleId={article.id} 
            onRestoreRevision={handleRevisionRestore}
          />
        </div>
      )}
    </div>
  );
}
