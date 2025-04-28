import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth/config';

/**
 * GET /api/notifications
 * 
 * Retrieves notifications for the authenticated user
 * Supports pagination and filtering by read status
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const isRead = searchParams.get('isRead');
    const type = searchParams.get('type');

    // Build filter conditions
    const where: any = { userId: user.id };
    
    if (isRead !== null) {
      where.isRead = isRead === 'true';
    }
    
    if (type) {
      where.type = type;
    }

    // Get total count for pagination
    const total = await prisma.notification.count({ where });

    // Get notifications with pagination
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * 
 * Marks notifications as read
 * Supports marking individual notifications or all notifications
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { notificationIds, markAll } = body;

    if (markAll) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true, readAt: new Date() }
      });

      return NextResponse.json({ message: 'All notifications marked as read' });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: { 
          id: { in: notificationIds },
          userId: user.id // Ensure user can only update their own notifications
        },
        data: { isRead: true, readAt: new Date() }
      });

      return NextResponse.json({ message: 'Notifications marked as read' });
    } else {
      return NextResponse.json(
        { error: 'Invalid request. Provide notificationIds array or markAll: true' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * 
 * Deletes notifications
 * Supports deleting individual notifications or all read notifications
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { notificationIds, deleteAllRead } = body;

    if (deleteAllRead) {
      // Delete all read notifications
      await prisma.notification.deleteMany({
        where: { userId: user.id, isRead: true }
      });

      return NextResponse.json({ message: 'All read notifications deleted' });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Delete specific notifications
      await prisma.notification.deleteMany({
        where: { 
          id: { in: notificationIds },
          userId: user.id // Ensure user can only delete their own notifications
        }
      });

      return NextResponse.json({ message: 'Notifications deleted' });
    } else {
      return NextResponse.json(
        { error: 'Invalid request. Provide notificationIds array or deleteAllRead: true' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}
