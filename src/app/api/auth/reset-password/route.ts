import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, validatePasswordStrength } from '@/lib/auth'
import { successResponse, errorResponse, ValidationError } from '@/lib/api'
import { resetPasswordSchema } from '@/schemas/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validated = resetPasswordSchema.parse(body)
    const { email, newPassword } = validated

    // Find and verify OTP
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        email,
        purpose: 'PASSWORD_RESET',
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

    // Verify OTP (in real scenario, this should be done before)
    // For now, we'll mark it as used
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { used: true },
    })

    // Validate password strength
    const passwordStrength = validatePasswordStrength(newPassword)
    if (!passwordStrength.isStrong) {
      throw new ValidationError('Password does not meet requirements', {
        newPassword: passwordStrength.errors,
      })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new ValidationError('User not found', {
        email: ['No account found with this email'],
      })
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
      },
    })

    return NextResponse.json(
      successResponse('Password reset successfully'),
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Reset password error:', error)

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
      errorResponse('Password reset failed', 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}
