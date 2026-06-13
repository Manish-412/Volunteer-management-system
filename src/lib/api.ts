/**
 * Standard API Response format
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
  errors?: Record<string, string[]>
}

/**
 * Create a success response
 */
export function successResponse<T>(
  message: string,
  data?: T
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
  }
}

/**
 * Create an error response
 */
export function errorResponse(
  message: string,
  error?: string,
  errors?: Record<string, string[]>
): ApiResponse {
  return {
    success: false,
    message,
    error: error || message,
    errors,
  }
}

/**
 * Standard Error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Validation error
 */
export class ValidationError extends ApiError {
  constructor(
    message: string,
    errors: Record<string, string[]>
  ) {
    super(400, message, errors)
    this.name = 'ValidationError'
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(401, message)
    this.name = 'AuthenticationError'
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(403, message)
    this.name = 'AuthorizationError'
  }
}

/**
 * Not found error
 */
export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, `${resource} not found`)
    this.name = 'NotFoundError'
  }
}

/**
 * Conflict error
 */
export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message)
    this.name = 'ConflictError'
  }
}
