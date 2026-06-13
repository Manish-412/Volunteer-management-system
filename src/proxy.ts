import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt'

const publicRoutes = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/login-with-otp',
  '/api/auth/send-otp',
  '/api/auth/verify-otp',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
]

const adminRoutes = [
  '/api/admin',
  '/api/admin/users',
  '/api/admin/dashboard',
]

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  const authHeader = request.headers.get('Authorization')
  const token = extractTokenFromHeader(authHeader ?? undefined) || request.cookies.get('token')?.value

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    )
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return NextResponse.json(
      { success: false, message: 'Invalid or expired token' },
      { status: 401 }
    )
  }

  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', decoded.userId)
  requestHeaders.set('x-user-email', decoded.email)
  requestHeaders.set('x-user-role', decoded.role)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/api/:path*'],
}
