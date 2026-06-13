import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, AuthorizationError } from '@/lib/api'
import { getUserRoleFromRequest } from '@/utils/helpers'

export async function GET(request: NextRequest) {
  try {
    const userRole = getUserRoleFromRequest(request.headers)
    
    if (userRole !== 'ADMIN') {
      throw new AuthorizationError('Only admins can access dashboard')
    }

    // Get dashboard statistics
    const [
      totalUsers,
      totalVolunteers,
      activeVolunteers,
      inactiveVolunteers,
      totalEvents,
      upcomingEvents,
      totalParticipations,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.volunteer.count(),
      prisma.volunteer.count({ where: { status: 'ACTIVE' } }),
      prisma.volunteer.count({ where: { status: { in: ['INACTIVE', 'DEACTIVATED'] } } }),
      prisma.event.count(),
      prisma.event.count({ where: { status: { in: ['UPCOMING', 'ONGOING'] } } }),
      prisma.eventParticipant.count({ where: { status: { not: 'CANCELLED' } } }),
    ])

    // Get recent volunteers
    const recentVolunteers = await prisma.volunteer.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true } },
      },
    })

    // Get upcoming events
    const upcomingEventsList = await prisma.event.findMany({
      where: { status: { in: ['UPCOMING', 'ONGOING'] } },
      take: 5,
      orderBy: { date: 'asc' },
      include: {
        participants: {
          where: { status: { not: 'CANCELLED' } },
          select: { id: true },
        },
      },
    })

    // Get volunteers by status
    const volunteersByStatus = await prisma.volunteer.groupBy({
      by: ['status'],
      _count: true,
    })

    // Get events by status
    const eventsByStatus = await prisma.event.groupBy({
      by: ['status'],
      _count: true,
    })

    return NextResponse.json(
      successResponse('Dashboard data retrieved successfully', {
        statistics: {
          totalUsers,
          totalVolunteers,
          activeVolunteers,
          inactiveVolunteers,
          totalEvents,
          upcomingEvents,
          totalParticipations,
        },
        recentVolunteers: recentVolunteers.map(v => ({
          id: v.id,
          fullName: v.fullName,
          email: v.user.email,
          status: v.status,
          joiningDate: v.joiningDate,
        })),
        upcomingEvents: upcomingEventsList.map(e => ({
          id: e.id,
          title: e.title,
          date: e.date,
          location: e.location,
          participantCount: e.participants.length,
          requiredVolunteers: e.requiredVolunteers,
        })),
        volunteersByStatus,
        eventsByStatus,
      }),
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Dashboard error:', error)

    if (error.statusCode) {
      return NextResponse.json(
        errorResponse(error.message, error.message),
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      errorResponse('Failed to fetch dashboard data', 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}
