import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthenticationError, errorResponse, successResponse } from '@/lib/api'
import { getUserIdFromRequest } from '@/utils/helpers'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request.headers)
    if (!userId) {
      throw new AuthenticationError()
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        emailVerified: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        volunteer: {
          select: {
            id: true,
            status: true,
            phoneNumber: true,
            city: true,
            country: true,
            occupation: true,
            skills: true,
            interests: true,
            availability: true,
            eventParticipants: {
              select: {
                id: true,
                status: true,
                event: {
                  select: {
                    id: true,
                    title: true,
                    date: true,
                    location: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      throw new AuthenticationError('Account not found')
    }

    return NextResponse.json(successResponse('Current user retrieved', user))
  } catch (error: any) {
    return NextResponse.json(
      errorResponse(error.message || 'Unable to retrieve current user'),
      { status: error.statusCode || 500 }
    )
  }
}
