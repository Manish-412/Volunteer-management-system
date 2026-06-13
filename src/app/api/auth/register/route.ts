import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, validatePasswordStrength } from '@/lib/auth'
import { generateToken } from '@/lib/jwt'
import { successResponse, errorResponse, ConflictError, ValidationError } from '@/lib/api'
import { sendWelcomeEmail, sendOTPEmail } from '@/lib/email'
import { registerSchema } from '@/schemas/validation'
import { hashOTP, generateOTP } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validated = registerSchema.parse(body)
    const { fullName, email, password } = validated

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new ConflictError('Email already registered')
    }

    // Validate password strength
    const passwordStrength = validatePasswordStrength(password)
    if (!passwordStrength.isStrong) {
      throw new ValidationError('Password does not meet requirements', {
        password: passwordStrength.errors,
      })
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        role: 'VOLUNTEER',
      },
    })

    // Send welcome email
    await sendWelcomeEmail(email, fullName)

    // Generate and send OTP for email verification
    const otp = generateOTP()
    const otpHash = await hashOTP(otp)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    await prisma.oTP.create({
      data: {
        email,
        otpHash,
        purpose: 'EMAIL_VERIFICATION',
        expiresAt,
        userId: user.id,
      },
    })

    // Send OTP email
    await sendOTPEmail(email, otp, 'EMAIL_VERIFICATION')

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const response = NextResponse.json(
      successResponse('Registration successful. Please verify your email with the OTP sent.', {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        token,
      }),
      { status: 201 }
    )

    // Set secure HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error: any) {
    console.error('❌ Registration error:', error)

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
      errorResponse('Registration failed', 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}
