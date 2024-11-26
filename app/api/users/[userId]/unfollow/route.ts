import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { userId } = params

    if (!userId || typeof userId !== 'string') {
      return new NextResponse('Invalid user ID', { status: 400 })
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: {
        email: session.user?.email!,
      },
    })

    if (!currentUser) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    })

    if (!targetUser) {
      return new NextResponse('Target user not found', { status: 404 })
    }

    // Check if already following
    const existingFollow = await prisma.follows.findFirst({
      where: {
        followerId: currentUser.id,
        followingId: userId,
      },
    })

    if (!existingFollow) {
      return new NextResponse('Not following this user', { status: 400 })
    }

    // Remove follow relationship
    await prisma.follows.delete({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: userId
        }
      },
    })

    return new NextResponse('Successfully unfollowed user', { status: 200 })
  } catch (error) {
    console.error('[UNFOLLOW_ERROR]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
