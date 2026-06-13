import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, AuthorizationError, NotFoundError, ValidationError } from '@/lib/api'
import { getUserRoleFromRequest } from '@/utils/helpers'
import { updateUserStatusSchema, updateUserRoleSchema } from '@/schemas/validation'

// PATCH /api/admin/users/:id/status - Update user status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userRole = getUserRoleFromRequest(request.headers)
    
    if (userRole !== 'ADMIN') {
      throw new AuthorizationError('Only admins can update user status')
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    const body = await request.json()
    const action = request.nextUrl.searchParams.get('action')

    if (action === 'status') {
      // Update volunteer status
      const validated = updateUserStatusSchema.parse(body)

      const volunteer = await prisma.volunteer.findUnique({
        where: { userId: id },
      })

      if (!volunteer) {
        throw new NotFoundError('Volunteer profile')
      }

      const updated = await prisma.volunteer.update({
        where: { id: volunteer.id },
        data: { status: validated.status },
      })

      return NextResponse.json(
        successResponse('Volunteer status updated successfully', updated),
        { status: 200 }
      )
    } else if (action === 'role') {
      // Update user role
      const validated = updateUserRoleSchema.parse(body)

      const updated = await prisma.user.update({
        where: { id },
        data: { role: validated.role },
      })

      return NextResponse.json(
        successResponse('User role updated successfully', {
          id: updated.id,
          fullName: updated.fullName,
          email: updated.email,
          role: updated.role,
        }),
        { status: 200 }
      )
    } else {
      throw new ValidationError('Invalid action', {
        action: ['Action must be either "status" or "role"'],
      })
    }
  } catch (error: any) {
    console.error('❌ Update user status error:', error)

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
        errorResponse(error.message, error.message, error.errors),
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      errorResponse('Failed to update user', 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}
