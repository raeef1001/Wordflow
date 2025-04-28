import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth/config';

/**
 * GET /api/achievements
 * 
 * Retrieves all available achievements or user achievements if userId is provided
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (userId) {
      // Get user achievements
      const userAchievements = await prisma.userAchievement.findMany({
        where: { userId },
        include: {
          achievement: true
        },
        orderBy: {
          awardedAt: 'desc'
        }
      });

      return NextResponse.json({ userAchievements });
    } else {
      // Get all achievements
      const achievements = await prisma.achievement.findMany({
        orderBy: {
          points: 'desc'
        }
      });

      return NextResponse.json({ achievements });
    }
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/achievements
 * 
 * Creates a new achievement (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, badge, criteria, points } = body;

    // Validate required fields
    if (!name || !description || !badge || !criteria) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new achievement
    const achievement = await prisma.achievement.create({
      data: {
        name,
        description,
        badge,
        criteria: JSON.stringify(criteria),
        points: points || 0
      }
    });

    return NextResponse.json({ achievement }, { status: 201 });
  } catch (error) {
    console.error('Error creating achievement:', error);
    return NextResponse.json(
      { error: 'Failed to create achievement' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/achievements
 * 
 * Updates an existing achievement (admin only)
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, description, badge, criteria, points } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Achievement ID is required' },
        { status: 400 }
      );
    }

    // Check if achievement exists
    const existingAchievement = await prisma.achievement.findUnique({
      where: { id }
    });

    if (!existingAchievement) {
      return NextResponse.json(
        { error: 'Achievement not found' },
        { status: 404 }
      );
    }

    // Update achievement
    const updatedAchievement = await prisma.achievement.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description || undefined,
        badge: badge || undefined,
        criteria: criteria ? JSON.stringify(criteria) : undefined,
        points: points !== undefined ? points : undefined
      }
    });

    return NextResponse.json({ achievement: updatedAchievement });
  } catch (error) {
    console.error('Error updating achievement:', error);
    return NextResponse.json(
      { error: 'Failed to update achievement' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/achievements
 * 
 * Deletes an achievement (admin only)
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Achievement ID is required' },
        { status: 400 }
      );
    }

    // Check if achievement exists
    const existingAchievement = await prisma.achievement.findUnique({
      where: { id }
    });

    if (!existingAchievement) {
      return NextResponse.json(
        { error: 'Achievement not found' },
        { status: 404 }
      );
    }

    // Delete achievement
    await prisma.achievement.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Achievement deleted successfully' });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    return NextResponse.json(
      { error: 'Failed to delete achievement' },
      { status: 500 }
    );
  }
}
