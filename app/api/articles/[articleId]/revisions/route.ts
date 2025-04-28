import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth/config';
import { createArticleRevision } from '@/lib/db/triggers';

/**
 * GET /api/articles/[articleId]/revisions
 * 
 * Retrieves revision history for a specific article
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
        authorId: true,
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

    // Get revisions
    const revisions = await prisma.articleRevision.findMany({
      where: { articleId },
      orderBy: { version: 'desc' }
    });

    return NextResponse.json({ revisions });
  } catch (error) {
    console.error('Error fetching article revisions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article revisions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/articles/[articleId]/revisions
 * 
 * Creates a new revision for an article
 * Only the article author can create revisions
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { articleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { articleId } = params;

    // Get the article
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        authorId: true,
        title: true,
        content: true,
        excerpt: true
      }
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Check if user is the article author
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (article.authorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, excerpt, changeLog } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Create revision
    await createArticleRevision(
      articleId,
      title,
      content,
      excerpt || article.excerpt || undefined,
      changeLog
    );

    // Update the article with the new content
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        title,
        content,
        excerpt: excerpt || undefined
      }
    });

    return NextResponse.json({ 
      message: 'Revision created successfully',
      article: updatedArticle
    });
  } catch (error) {
    console.error('Error creating article revision:', error);
    return NextResponse.json(
      { error: 'Failed to create article revision' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/articles/[articleId]/revisions/[revisionId]
 * 
 * Retrieves a specific revision
 */
export async function GET_REVISION(
  req: NextRequest,
  { params }: { params: { articleId: string; revisionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { articleId, revisionId } = params;

    // Get the article
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        authorId: true
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

    // Get the specific revision
    const revision = await prisma.articleRevision.findUnique({
      where: { id: revisionId }
    });

    if (!revision || revision.articleId !== articleId) {
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
    }

    return NextResponse.json({ revision });
  } catch (error) {
    console.error('Error fetching revision:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revision' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/articles/[articleId]/revisions/restore
 * 
 * Restores an article to a previous revision
 */
export async function POST_RESTORE(
  req: NextRequest,
  { params }: { params: { articleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { articleId } = params;

    // Get the article
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        authorId: true
      }
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Check if user is the article author
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (article.authorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { revisionId } = body;

    if (!revisionId) {
      return NextResponse.json(
        { error: 'Revision ID is required' },
        { status: 400 }
      );
    }

    // Get the revision to restore
    const revision = await prisma.articleRevision.findUnique({
      where: { id: revisionId }
    });

    if (!revision || revision.articleId !== articleId) {
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
    }

    // Create a new revision with the current state before restoring
    const currentArticle = await prisma.article.findUnique({
      where: { id: articleId },
      select: {
        title: true,
        content: true,
        excerpt: true
      }
    });

    if (currentArticle) {
      await createArticleRevision(
        articleId,
        currentArticle.title,
        currentArticle.content,
        currentArticle.excerpt || undefined,
        'Auto-saved before restoration'
      );
    }

    // Restore the article to the selected revision
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        title: revision.title,
        content: revision.content,
        excerpt: revision.excerpt || undefined
      }
    });

    // Create a new revision to mark the restoration
    await createArticleRevision(
      articleId,
      revision.title,
      revision.content,
      revision.excerpt || undefined,
      `Restored from revision ${revision.version}`
    );

    return NextResponse.json({ 
      message: 'Article restored successfully',
      article: updatedArticle
    });
  } catch (error) {
    console.error('Error restoring article:', error);
    return NextResponse.json(
      { error: 'Failed to restore article' },
      { status: 500 }
    );
  }
}
