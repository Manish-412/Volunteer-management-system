import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyOTP } from '@/lib/auth'
import { generateToken } from '@/lib/jwt'
import { successResponse, errorResponse, ValidationError } from '@/lib/api'
import { verifyOTPSchema } from '@/schemas/validation'

// Store to track verification attempts (in production, use Redis)
const verifyAttempts: Record<string, { count: number; blockedUntil: number }> = {}
const MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '3')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validated = verifyOTPSchema.parse(body)
    const { email, otp, purpose } = validated

    // Check attempt limit
    const now = Date.now()
    const attemptKey = `${email}-${purpose}`
    
    if (verifyAttempts[attemptKey]) {
      const { count, blockedUntil } = verifyAttempts[attemptKey]
      
      if (now < blockedUntil) {
        throw new ValidationError('Too many attempts', {
          otp: ['Too many failed attempts. Please try again later.'],
        })
      } else if (count >= MAX_ATTEMPTS) {
        delete verifyAttempts[attemptKey]
      }
    }

    // Find OTP
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        email,
        purpose,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    if (!otpRecord) {
      throw new ValidationError('Invalid or expired OTP', {
        otp: ['The OTP you entered is invalid or has expired'],
      })
    }

    // Verify OTP
    const isValid = await verifyOTP(otp, otpRecord.otpHash)
    if (!isValid) {
      // Track failed attempt
      if (verifyAttempts[attemptKey]) {
        verifyAttempts[attemptKey].count++
        if (verifyAttempts[attemptKey].count >= MAX_ATTEMPTS) {
          verifyAttempts[attemptKey].blockedUntil = now + 15 * 60 * 1000 // Block for 15 minutes
        }
      } else {
        verifyAttempts[attemptKey] = { count: 1, blockedUntil: 0 }
      }

      throw new ValidationError('Invalid OTP', {
        otp: ['The OTP you entered is incorrect'],
      })
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { used: true },
    })

    // Clear attempt tracking on success
    delete verifyAttempts[attemptKey]

    // Handle different purposes
    let responseData: any = { success: true }

    if (purpose === 'EMAIL_VERIFICATION') {
      // Update user email verified status
      const user = await prisma.user.update({
        where: { email },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      })

      responseData = {
        message: 'Email verified successfully',
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      }
    } else if (purpose === 'LOGIN') {
      // Find user and generate token
      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        throw new ValidationError('User not found', {
          email: ['No account found with this email'],
        })
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

      responseData = {
        message: 'Login successful',
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        token,
      }
    } else if (purpose === 'PASSWORD_RESET' || purpose === 'CHANGE_PASSWORD') {
      // Just confirm OTP verification, password reset will be handled next
      responseData = {
        message: 'OTP verified successfully',
        verified: true,
      }
    }

    const response = NextResponse.json(
      successResponse(responseData.message, responseData),
      { status: 200 }
    )

    // Set token if login
    if (purpose === 'LOGIN' && responseData.token) {
      response.cookies.set('token', responseData.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      })
    }

    return response
  } catch (error: any) {
    console.error('❌ Verify OTP error:', error)

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
      errorResponse('OTP verification failed', 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}
