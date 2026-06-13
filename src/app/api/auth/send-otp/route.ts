import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOTP, hashOTP } from '@/lib/auth'
import { successResponse, errorResponse, ValidationError } from '@/lib/api'
import { sendOTPEmail } from '@/lib/email'
import { sendOTPSchema } from '@/schemas/validation'

// Store to track OTP attempts (in production, use Redis)
const otpAttempts: Record<string, { count: number; resetTime: number }> = {}
const OTP_RESEND_WAIT = parseInt(process.env.OTP_RESEND_WAIT_SECONDS || '60') * 1000

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validated = sendOTPSchema.parse(body)
    const { email, purpose } = validated

    // Check rate limiting
    const now = Date.now()
    if (otpAttempts[email]) {
      const { resetTime } = otpAttempts[email]
      
      if (now < resetTime) {
        throw new ValidationError('Too many OTP requests', {
          email: [`Please wait ${Math.ceil((resetTime - now) / 1000)} seconds before requesting another OTP`],
        })
      } else {
        delete otpAttempts[email]
      }
    }

    // Delete expired OTPs
    await prisma.oTP.deleteMany({
      where: {
        email,
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    // Check if user exists for LOGIN purpose
    if (purpose === 'LOGIN') {
      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        throw new ValidationError('User not found', {
          email: ['No account found with this email'],
        })
      }
    } else {
      // For other purposes, check if user exists
      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user && (purpose === 'PASSWORD_RESET' || purpose === 'CHANGE_PASSWORD')) {
        throw new ValidationError('User not found', {
          email: ['No account found with this email'],
        })
      }
    }

    // Generate OTP
    const otp = generateOTP()
    const otpHash = await hashOTP(otp)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Delete previous OTPs for this email and purpose
    await prisma.oTP.deleteMany({
      where: {
        email,
        purpose,
        used: false,
      },
    })

    // Create new OTP
    await prisma.oTP.create({
      data: {
        email,
        otpHash,
        purpose,
        expiresAt,
      },
    })

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, purpose)

    if (!emailSent) {
      throw new Error('Failed to send OTP email')
    }

    // Track attempt
    otpAttempts[email] = {
      count: 1,
      resetTime: now + OTP_RESEND_WAIT,
    }

    return NextResponse.json(
      successResponse('OTP sent successfully to your email', {
        expiresIn: 300, // 5 minutes in seconds
      }),
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Send OTP error:', error)

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
      errorResponse('Failed to send OTP', 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}
