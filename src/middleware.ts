import { NextRequest, NextResponse } from 'next/server'

interface TokenPayload {
  userId: string
  email: string
  role: string
  exp?: number
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0))
}

async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.')
    if (!encodedHeader || !encodedPayload || !encodedSignature) return null

    const header = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(encodedHeader))
    ) as { alg?: string }
    if (header.alg !== 'HS256') return null

    const secret = process.env.JWT_SECRET || 'default-secret-key'
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      decodeBase64Url(encodedSignature),
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
    )
    if (!isValid) return null

    const payload = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(encodedPayload))
    ) as TokenPayload
    if (
      typeof payload.userId !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.role !== 'string' ||
      (payload.exp !== undefined && payload.exp <= Math.floor(Date.now() / 1000))
    ) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  const authHeader = request.headers.get('Authorization')
  const headerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null
  const token = headerToken || request.cookies.get('token')?.value

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    )
  }

  const decoded = await verifyToken(token)
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
