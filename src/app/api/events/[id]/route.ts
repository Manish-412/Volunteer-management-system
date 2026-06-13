import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateEventSchema } from '@/schemas/validation'
import { successResponse, errorResponse, NotFoundError, AuthorizationError } from '@/lib/api'
import { getUserRoleFromRequest } from '@/utils/helpers'

// GET /api/events/:id - Get event by ID with participants
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            volunteer: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                skills: true,
              },
            },
          },
        },
      },
    })

    if (!event) {
      throw new NotFoundError('Event')
    }

    return NextResponse.json(
      successResponse('Event retrieved successfully', event),
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Get event error:', error)

    if (error.statusCode) {
      return NextResponse.json(
        errorResponse(error.message, error.message),
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      errorResponse('Failed to fetch event', 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}

// PUT /api/events/:id - Update event (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userRole = getUserRoleFromRequest(request.headers)
    
    if (userRole !== 'ADMIN') {
      throw new AuthorizationError('Only admins can update events')
    }

    // Check if event exists
    const existing = await prisma.event.findUnique({
      where: { id },
    })

    if (!existing) {
      throw new NotFoundError('Event')
    }

    const body = await request.json()
    const validated = updateEventSchema.parse(body)

    // Update event
    const event = await prisma.event.update({
      where: { id },
      data: {
        title: validated.title,
        description: validated.description,
        date: validated.date ? new Date(validated.date) : undefined,
        location: validated.location,
        category: validated.category,
        requiredVolunteers: validated.requiredVolunteers,
      },
    })

    return NextResponse.json(
      successResponse('Event updated successfully', event),
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Update event error:', error)

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
      errorResponse('Failed to update event', 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}

// DELETE /api/events/:id - Delete event (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userRole = getUserRoleFromRequest(request.headers)
    
    if (userRole !== 'ADMIN') {
      throw new AuthorizationError('Only admins can delete events')
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id },
    })

    if (!event) {
      throw new NotFoundError('Event')
    }

    // Delete event (will cascade delete event participants)
    await prisma.event.delete({
      where: { id },
    })

    return NextResponse.json(
      successResponse('Event deleted successfully'),
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Delete event error:', error)

    if (error.statusCode) {
      return NextResponse.json(
        errorResponse(error.message, error.message),
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      errorResponse('Failed to delete event', 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}
