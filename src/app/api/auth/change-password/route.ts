import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, hashPassword, validatePasswordStrength, hashOTP, generateOTP } from '@/lib/auth'
import { successResponse, errorResponse, ValidationError, AuthenticationError } from '@/lib/api'
import { sendOTPEmail } from '@/lib/email'
import { getUserIdFromRequest } from '@/utils/helpers'
import { z } from 'zod'

// Step 1: Request OTP for password change
const stepOneSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  step: z.literal('request-otp'),
})

// Step 2: Verify OTP and change password
const stepTwoSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character (!@#$%^&*)'),
  confirmPassword: z.string(),
  step: z.literal('verify-and-change'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request.headers)
    if (!userId) {
      throw new AuthenticationError('User not authenticated')
    }

    const body = await request.json()
    const { step } = body

    if (step === 'request-otp') {
      return handleRequestOTP(userId, body)
    } else if (step === 'verify-and-change') {
      return handleVerifyAndChange(userId, body)
    } else {
      throw new ValidationError('Invalid step', {
        step: ['Step must be either "request-otp" or "verify-and-change"'],
      })
    }
  } catch (error: any) {
    console.error('❌ Change password error:', error)

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
      errorResponse('Password change failed', 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}

async function handleRequestOTP(userId: string, body: any) {
  try {
    const validated = stepOneSchema.parse(body)
    const { currentPassword } = validated

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new AuthenticationError('User not found')
    }

    if (!user.passwordHash) {
      throw new ValidationError('Account does not have a password set', {
        currentPassword: ['This account uses passwordless login'],
      })
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash)
    if (!isPasswordValid) {
      throw new AuthenticationError('Current password is incorrect')
    }

    // Generate OTP
    const otp = generateOTP()
    const otpHash = await hashOTP(otp)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Delete previous change password OTPs
    await prisma.oTP.deleteMany({
      where: {
        userId,
        purpose: 'CHANGE_PASSWORD',
        used: false,
      },
    })

    // Create OTP record
    await prisma.oTP.create({
      data: {
        email: user.email,
        otpHash,
        purpose: 'CHANGE_PASSWORD',
        expiresAt,
        userId,
      },
    })

    // Send OTP email
    await sendOTPEmail(user.email, otp, 'CHANGE_PASSWORD')

    return NextResponse.json(
      successResponse('OTP sent to your email for password change verification', {
        expiresIn: 300, // 5 minutes in seconds
      }),
      { status: 200 }
    )
  } catch (error: any) {
    throw error
  }
}

async function handleVerifyAndChange(userId: string, body: any) {
  try {
    const validated = stepTwoSchema.parse(body)
    const { otp, newPassword } = validated

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new AuthenticationError('User not found')
    }

    // Find valid OTP
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        userId,
        purpose: 'CHANGE_PASSWORD',
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    if (!otpRecord) {
      throw new ValidationError('Invalid or expired OTP', {
        otp: ['The OTP is invalid or has expired'],
      })
    }

    // Verify OTP (in real implementation, verify the OTP hash)
    const { verifyOTP } = await import('@/lib/auth')
    const isOtpValid = await verifyOTP(otp, otpRecord.otpHash)
    if (!isOtpValid) {
      throw new ValidationError('Invalid OTP', {
        otp: ['The OTP you entered is incorrect'],
      })
    }

    // Validate new password strength
    const passwordStrength = validatePasswordStrength(newPassword)
    if (!passwordStrength.isStrong) {
      throw new ValidationError('Password does not meet requirements', {
        newPassword: passwordStrength.errors,
      })
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { used: true },
    })

    // Hash and update password
    const passwordHash = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
      },
    })

    return NextResponse.json(
      successResponse('Password changed successfully'),
      { status: 200 }
    )
  } catch (error: any) {
    throw error
  }
}
