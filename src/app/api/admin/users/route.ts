import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, AuthorizationError } from '@/lib/api'
import { getUserRoleFromRequest } from '@/utils/helpers'

// GET /api/admin/users - Get all users
export async function GET(request: NextRequest) {
  try {
    const userRole = getUserRoleFromRequest(request.headers)
    
    if (userRole !== 'ADMIN') {
      throw new AuthorizationError('Only admins can access user management')
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (role) {
      where.role = role
    }

    // Get total count
    const total = await prisma.user.count({ where })

    // Get users
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        emailVerified: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      successResponse('Users retrieved successfully', {
        users,
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
    console.error('❌ Get users error:', error)

    if (error.statusCode) {
      return NextResponse.json(
        errorResponse(error.message, error.message),
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      errorResponse('Failed to fetch users', 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}
