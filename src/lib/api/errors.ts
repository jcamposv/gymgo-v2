import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'INVALID_API_KEY'
  | 'INVALID_TOKEN'
  | 'EXPIRED_TOKEN'
  | 'MISSING_API_KEY'
  | 'MISSING_AUTH_HEADER'

interface ApiErrorOptions {
  code: ApiErrorCode
  message: string
  status: number
  details?: Record<string, string[]>
}

export function apiError(options: ApiErrorOptions): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: options.code,
        message: options.message,
        ...(options.details && { details: options.details }),
      },
    },
    { status: options.status }
  )
}

export function validationError(error: ZodError): NextResponse {
  return apiError({
    code: 'VALIDATION_ERROR',
    message: 'Request validation failed',
    status: 400,
    details: error.flatten().fieldErrors as Record<string, string[]>,
  })
}

export function unauthorizedError(message = 'Authentication required'): NextResponse {
  return apiError({
    code: 'UNAUTHORIZED',
    message,
    status: 401,
  })
}

export function forbiddenError(message = 'Access denied'): NextResponse {
  return apiError({
    code: 'FORBIDDEN',
    message,
    status: 403,
  })
}

export function notFoundError(message = 'Resource not found'): NextResponse {
  return apiError({
    code: 'NOT_FOUND',
    message,
    status: 404,
  })
}

export function conflictError(message: string): NextResponse {
  return apiError({
    code: 'CONFLICT',
    message,
    status: 409,
  })
}

export function rateLimitError(): NextResponse {
  return apiError({
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later',
    status: 429,
  })
}

export function internalError(message = 'Internal server error'): NextResponse {
  return apiError({
    code: 'INTERNAL_ERROR',
    message,
    status: 500,
  })
}

export function invalidApiKeyError(): NextResponse {
  return apiError({
    code: 'INVALID_API_KEY',
    message: 'Invalid or missing API key',
    status: 401,
  })
}

export function invalidTokenError(): NextResponse {
  return apiError({
    code: 'INVALID_TOKEN',
    message: 'Invalid or malformed token',
    status: 401,
  })
}

export function expiredTokenError(): NextResponse {
  return apiError({
    code: 'EXPIRED_TOKEN',
    message: 'Token has expired',
    status: 401,
  })
}
