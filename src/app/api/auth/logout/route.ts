import { NextRequest, NextResponse } from 'next/server'
import { successResponse } from '@/lib/api'

export async function POST(_request: NextRequest) {
  const response = NextResponse.json(
    successResponse('Logged out successfully'),
    { status: 200 }
  )

  // Clear the token cookie
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // This will delete the cookie
  })

  return response
}
