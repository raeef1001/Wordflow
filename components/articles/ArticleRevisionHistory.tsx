import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  ClockIcon, 
  ArrowPathIcon, 
  DocumentTextIcon,
  EyeIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from 'date-fns';

type ArticleRevisionHistoryProps = {
  articleId: string;
  onRestoreRevision?: () => void;
};

type Revision = {
  id: string;
  articleId: string;
  version: number;
  title: string;
  content: string;
  excerpt: string | null;
  changeLog: string | null;
  createdAt: string;
};

export default function ArticleRevisionHistory({ 
  articleId,
  onRestoreRevision
}: ArticleRevisionHistoryProps) {
  const { data: session } = useSession();
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [previewMode, setPreviewMode] = useState<'diff' | 'full'>('diff');

  useEffect(() => {
    if (session && articleId) {
      fetchRevisions();
    }
  }, [session, articleId]);

  const fetchRevisions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/articles/${articleId}/revisions`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch revision history');
      }
      
      const data = await response.json();
      setRevisions(data.revisions);
      
      if (data.revisions.length > 0) {
        setSelectedRevision(data.revisions[0]);
      }
    } catch (err) {
      setError('Error loading revision history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevisionDetails = async (revisionId: string) => {
    try {
      const response = await fetch(`/api/articles/${articleId}/revisions/${revisionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch revision details');
      }
      
      const data = await response.json();
      setSelectedRevision(data.revision);
    } catch (err) {
      console.error(err);
    }
  };

  const restoreRevision = async (revisionId: string) => {
    try {
      setRestoring(true);
      const response = await fetch(`/api/articles/${articleId}/revisions/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          revisionId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to restore revision');
      }
      
      // Refresh the revision history
      await fetchRevisions();
      
      // Notify parent component
      if (onRestoreRevision) {
        onRestoreRevision();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRestoring(false);
    }
  };

  // Function to create a simple diff view
  const getDiffPreview = (content: string) => {
    // For a simple implementation, just show the first 300 characters
    return content.substring(0, 300) + (content.length > 300 ? '...' : '');
  };

  if (!session) {
    return <div className="text-center py-4">Please sign in to view revision history</div>;
  }

  if (loading && revisions.length === 0) {
    return <div className="text-center py-4">Loading revision history...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  if (revisions.length === 0) {
    return <div className="text-center py-4">No revision history available</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Revision History</h2>
        <p className="text-sm text-gray-500">
          {revisions.length} {revisions.length === 1 ? 'version' : 'versions'} available
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        {/* Revisions List */}
        <div className="border-r">
          <div className="p-3 bg-gray-50 border-b">
            <h3 className="text-sm font-medium">Versions</h3>
          </div>
          <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {revisions.map((revision) => (
              <li
                key={revision.id}
                className={`hover:bg-gray-50 cursor-pointer ${
                  selectedRevision?.id === revision.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedRevision(revision)}
              >
                <div className="p-4">
                  <div className="flex items-start">
                    <div className="bg-gray-100 p-2 rounded-full">
                      <ClockIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Version {revision.version}
                        {revision.version === revisions.length && ' (Current)'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(revision.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                      {revision.changeLog && (
                        <p className="text-xs text-gray-600 mt-1">{revision.changeLog}</p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Revision Details */}
        <div className="col-span-2">
          {selectedRevision ? (
            <>
              <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                <h3 className="text-sm font-medium">
                  Version {selectedRevision.version} Details
                </h3>
                <div className="flex space-x-2">
                  <button
                    className={`text-xs px-2 py-1 rounded ${
                      previewMode === 'diff'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                    onClick={() => setPreviewMode('diff')}
                  >
                    Preview
                  </button>
                  <button
                    className={`text-xs px-2 py-1 rounded ${
                      previewMode === 'full'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                    onClick={() => setPreviewMode('full')}
                  >
                    Full Content
                  </button>
                  {selectedRevision.version !== revisions.length && (
                    <button
                      className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded flex items-center"
                      onClick={() => restoreRevision(selectedRevision.id)}
                      disabled={restoring}
                    >
                      {restoring ? (
                        <ArrowPathIcon className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <ArrowUturnLeftIcon className="h-3 w-3 mr-1" />
                      )}
                      Restore
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700">Title</h4>
                  <p className="mt-1 text-sm">{selectedRevision.title}</p>
                </div>

                {selectedRevision.excerpt && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700">Excerpt</h4>
                    <p className="mt-1 text-sm">{selectedRevision.excerpt}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-700">Content</h4>
                  <div className="mt-2 border rounded-md p-3 bg-gray-50 max-h-96 overflow-y-auto">
                    {previewMode === 'diff' ? (
                      <div className="prose prose-sm max-w-none">
                        {getDiffPreview(selectedRevision.content)}
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                        {selectedRevision.content}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Select a revision to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
