import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateVolunteerSchema } from '@/schemas/validation'
import { successResponse, errorResponse, AuthenticationError, NotFoundError, AuthorizationError } from '@/lib/api'
import { getUserIdFromRequest, getUserRoleFromRequest } from '@/utils/helpers'

// GET /api/volunteers/:id - Get volunteer by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = getUserIdFromRequest(request.headers)
    if (!userId) {
      throw new AuthenticationError('User not authenticated')
    }

    const volunteer = await prisma.volunteer.findUnique({
      where: { id },
      include: {
        user: {
          select: { email: true, emailVerified: true, createdAt: true },
        },
        eventParticipants: {
          include: {
            event: {
              select: { id: true, title: true, date: true, location: true },
            },
          },
        },
      },
    })

    if (!volunteer) {
      throw new NotFoundError('Volunteer')
    }

    return NextResponse.json(
      successResponse('Volunteer retrieved successfully', volunteer),
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Get volunteer error:', error)

    if (error.statusCode) {
      return NextResponse.json(
        errorResponse(error.message, error.message),
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      errorResponse('Failed to fetch volunteer', 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}

// PUT /api/volunteers/:id - Update volunteer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = getUserIdFromRequest(request.headers)
    const userRole = getUserRoleFromRequest(request.headers)
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated')
    }

    // Check if user is updating their own profile or is admin
    const volunteer = await prisma.volunteer.findUnique({
      where: { id },
    })

    if (!volunteer) {
      throw new NotFoundError('Volunteer')
    }

    // Only allow users to update their own profile or admins
    if (volunteer.userId !== userId && userRole !== 'ADMIN') {
      throw new AuthorizationError('You can only update your own profile')
    }

    const body = await request.json()
    const validated = updateVolunteerSchema.parse(body)

    // Update volunteer
    const updated = await prisma.volunteer.update({
      where: { id },
      data: {
        fullName: validated.fullName,
        phoneNumber: validated.phoneNumber,
        gender: validated.gender,
        dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : undefined,
        address: validated.address,
        city: validated.city,
        state: validated.state,
        country: validated.country,
        skills: validated.skills,
        interests: validated.interests,
        availability: validated.availability,
        emergencyContact: validated.emergencyContact,
        emergencyPhone: validated.emergencyPhone,
        bloodGroup: validated.bloodGroup,
        occupation: validated.occupation,
      },
    })

    return NextResponse.json(
      successResponse('Volunteer updated successfully', updated),
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Update volunteer error:', error)

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
      errorResponse('Failed to update volunteer', 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}

// DELETE /api/volunteers/:id - Delete volunteer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = getUserIdFromRequest(request.headers)
    const userRole = getUserRoleFromRequest(request.headers)
    
    if (!userId) {
      throw new AuthenticationError('User not authenticated')
    }

    // Check if volunteer exists
    const volunteer = await prisma.volunteer.findUnique({
      where: { id },
    })

    if (!volunteer) {
      throw new NotFoundError('Volunteer')
    }

    // Only allow users to delete their own profile or admins
    if (volunteer.userId !== userId && userRole !== 'ADMIN') {
      throw new AuthorizationError('You can only delete your own profile')
    }

    // Delete volunteer (this will cascade delete event participants)
    await prisma.volunteer.delete({
      where: { id },
    })

    return NextResponse.json(
      successResponse('Volunteer deleted successfully'),
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Delete volunteer error:', error)

    if (error.statusCode) {
      return NextResponse.json(
        errorResponse(error.message, error.message),
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      errorResponse('Failed to delete volunteer', 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}
