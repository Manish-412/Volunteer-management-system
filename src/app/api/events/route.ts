import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createEventSchema } from '@/schemas/validation'
import { successResponse, errorResponse, AuthorizationError } from '@/lib/api'
import { getUserRoleFromRequest } from '@/utils/helpers'

// GET /api/events - Get all events with filtering, pagination, and search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status) {
      where.status = status
    }
    if (category) {
      where.category = category
    }

    // Get total count
    const total = await prisma.event.count({ where })

    // Get events
    const events = await prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        participants: {
          where: { status: { not: 'CANCELLED' } },
          select: { id: true, volunteerId: true },
        },
      },
    })

    return NextResponse.json(
      successResponse('Events retrieved successfully', {
        events: events.map(e => ({
          ...e,
          participantCount: e.participants.length,
          participants: undefined,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }),
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Get events error:', error)

    return NextResponse.json(
      errorResponse('Failed to fetch events', 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}

// POST /api/events - Create new event (Admin only)
export async function POST(request: NextRequest) {
  try {
    const userRole = getUserRoleFromRequest(request.headers)
    
    if (userRole !== 'ADMIN') {
      throw new AuthorizationError('Only admins can create events')
    }

    const body = await request.json()
    const validated = createEventSchema.parse(body)

    // Create event
    const event = await prisma.event.create({
      data: {
        title: validated.title,
        description: validated.description,
        date: new Date(validated.date),
        location: validated.location,
        category: validated.category,
        requiredVolunteers: validated.requiredVolunteers,
        status: 'UPCOMING',
      },
    })

    return NextResponse.json(
      successResponse('Event created successfully', event),
      { status: 201 }
    )
  } catch (error: any) {
    console.error('❌ Create event error:', error)

    if (error.name === 'ZodError') {
      const errors: Record<string, string[]> = {}
      error.errors.forEach((err: any) => {
        const path = err.path.join('.')
        errors[path] = [err.message]
      })
      return NextResponse.json(
        errorResponse('Validation error', 'Invalid input', errors),
        { status: 400 }
      )
    }

    if (error.statusCode) {
      return NextResponse.json(
        errorResponse(error.message, error.message),
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      errorResponse('Failed to create event', 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}
