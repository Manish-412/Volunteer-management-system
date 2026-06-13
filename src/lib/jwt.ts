import jwt from 'jsonwebtoken'

interface TokenPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key'
const JWT_EXPIRY = '7d'

/**
 * Generate JWT token for user
 */
export function generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  })
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.slice(7)
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = verifyToken(token)
  if (!decoded) return true
  
  const now = Math.floor(Date.now() / 1000)
  return (decoded.exp || 0) < now
}
