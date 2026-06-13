import bcryptjs from 'bcryptjs'

const SALT_ROUNDS = 12

/**
 * Hash a password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS)
}

/**
 * Compare a plain password with hashed password
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcryptjs.compare(plainPassword, hashedPassword)
}

/**
 * Generate a random 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Hash OTP before storing
 */
export async function hashOTP(otp: string): Promise<string> {
  // Simple hashing for OTP - can use bcryptjs too
  return bcryptjs.hash(otp, 6)
}

/**
 * Verify OTP
 */
export async function verifyOTP(plainOTP: string, hashedOTP: string): Promise<boolean> {
  return bcryptjs.compare(plainOTP, hashedOTP)
}

/**
 * Check password strength
 */
export function validatePasswordStrength(password: string): {
  isStrong: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)')
  }

  return {
    isStrong: errors.length === 0,
    errors,
  }
}
