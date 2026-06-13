import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createVolunteerSchema } from '@/schemas/validation'
import { successResponse, errorResponse, AuthenticationError, ConflictError } from '@/lib/api'
import { getUserIdFromRequest } from '@/utils/helpers'

// GET /api/volunteers - Get all volunteers with filtering, pagination, and search
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request.headers)
    if (!userId) {
      throw new AuthenticationError('User not authenticated')
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status) {
      where.status = status
    }

    // Get total count
    const total = await prisma.volunteer.count({ where })

    // Get volunteers
    const volunteers = await prisma.volunteer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: {
          select: { email: true, emailVerified: true },
        },
        eventParticipants: {
          select: { id: true },
        },
      },
    })

    return NextResponse.json(
      successResponse('Volunteers retrieved successfully', {
        volunteers: volunteers.map(v => ({
          ...v,
          eventCount: v.eventParticipants.length,
          eventParticipants: undefined,
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
    console.error('❌ Get volunteers error:', error)

    if (error.statusCode) {
      return NextResponse.json(
        errorResponse(error.message, error.message),
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      errorResponse('Failed to fetch volunteers', 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}

// POST /api/volunteers - Create new volunteer
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request.headers)
    if (!userId) {
      throw new AuthenticationError('User not authenticated')
    }

    const body = await request.json()

    // Validate input
    const validated = createVolunteerSchema.parse(body)

    // Check if volunteer profile already exists for this user
    const existing = await prisma.volunteer.findUnique({
      where: { userId },
    })

    if (existing) {
      throw new ConflictError('Volunteer profile already exists for this user')
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new AuthenticationError('User not found')
    }

    // Create volunteer profile
    const volunteer = await prisma.volunteer.create({
      data: {
        userId,
        fullName: validated.fullName,
        email: user.email,
        phoneNumber: validated.phoneNumber,
        gender: validated.gender,
        dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : null,
        address: validated.address,
        city: validated.city,
        state: validated.state,
        country: validated.country,
        skills: validated.skills || [],
        interests: validated.interests || [],
        availability: validated.availability || [],
        emergencyContact: validated.emergencyContact,
        emergencyPhone: validated.emergencyPhone,
        bloodGroup: validated.bloodGroup,
        occupation: validated.occupation,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json(
      successResponse('Volunteer profile created successfully', volunteer),
      { status: 201 }
    )
  } catch (error: any) {
    console.error('❌ Create volunteer error:', error)

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
      errorResponse('Failed to create volunteer profile', 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}
