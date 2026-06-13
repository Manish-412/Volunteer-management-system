import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword } from '@/lib/auth'
import { generateToken } from '@/lib/jwt'
import { successResponse, errorResponse, AuthenticationError } from '@/lib/api'
import { loginSchema } from '@/schemas/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validated = loginSchema.parse(body)
    const { email, password, role, rememberMe } = validated

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new AuthenticationError('Invalid email or password')
    }

    if (user.role !== role) {
      throw new AuthenticationError(`This account is not registered as ${role.toLowerCase()}`)
    }

    // Check password
    if (!user.passwordHash) {
      throw new AuthenticationError('This account uses passwordless login')
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash)
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password')
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const response = NextResponse.json(
      successResponse('Login successful', {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        token,
      }),
      { status: 200 }
    )

    // Set secure HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 7 * 24 * 60 * 60 : undefined,
    })

    return response
  } catch (error: any) {
    console.error('❌ Login error:', error)

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
      errorResponse('Login failed', 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}
