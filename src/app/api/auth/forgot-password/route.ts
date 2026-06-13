import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOTP, hashOTP } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'
import { sendPasswordResetEmail, sendOTPEmail } from '@/lib/email'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validated = forgotPasswordSchema.parse(body)
    const { email } = validated

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Don't reveal if user exists (security best practice)
      return NextResponse.json(
        successResponse('If an account exists with this email, password reset instructions have been sent'),
        { status: 200 }
      )
    }

    // Delete previous password reset OTPs
    await prisma.oTP.deleteMany({
      where: {
        email,
        purpose: 'PASSWORD_RESET',
        used: false,
      },
    })

    // Generate OTP
    const otp = generateOTP()
    const otpHash = await hashOTP(otp)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Create OTP record
    await prisma.oTP.create({
      data: {
        email,
        otpHash,
        purpose: 'PASSWORD_RESET',
        expiresAt,
        userId: user.id,
      },
    })

    // Send password reset email with OTP
    await sendPasswordResetEmail(email, user.fullName)
    await sendOTPEmail(email, otp, 'PASSWORD_RESET')

    return NextResponse.json(
      successResponse('Password reset instructions have been sent to your email'),
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Forgot password error:', error)

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

    return NextResponse.json(
      errorResponse('Failed to send password reset instructions', 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}
