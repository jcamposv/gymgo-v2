import { type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { API_HEADERS, API_PUBLIC_ROUTES } from '@/lib/constants'
import type { Database } from '@/types/database.types'
import { checkApiAccess, checkApiRateLimit, consumeApiRequest } from '@/lib/plan-limits'

export interface ApiAuthContext {
  isValid: boolean
  userId?: string
  tenantId?: string
  organizationId?: string
  email?: string
  error?: string
  rateLimitInfo?: {
    used: number
    remaining: number
    dailyLimit: number
  }
}

const validApiKeys = new Set(
  [
    process.env.API_KEY_MOBILE,
    process.env.API_KEY_INTERNAL,
  ].filter(Boolean)
)

/**
 * Validates the API key from request headers
 * API key identifies the legitimate app (Flutter, internal tools)
 */
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get(API_HEADERS.API_KEY)

  if (!apiKey) {
    return false
  }

  // In development, allow a test key
  if (process.env.NODE_ENV === 'development' && apiKey === 'dev_test_key_32_chars_minimum!!') {
    return true
  }

  return validApiKeys.has(apiKey)
}

/**
 * Validates the Bearer token and returns user context
 * Used for authenticated endpoints
 */
export async function validateBearerToken(
  request: NextRequest
): Promise<ApiAuthContext> {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      isValid: false,
      error: 'Missing or invalid Authorization header',
    }
  }

  const token = authHeader.replace('Bearer ', '')

  if (!token) {
    return {
      isValid: false,
      error: 'Token is empty',
    }
  }

  // Use Supabase to validate the token
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return {
      isValid: false,
      error: error?.message || 'Invalid token',
    }
  }

  // Extract tenant_id from user metadata if available
  const tenantId = user.user_metadata?.tenant_id as string | undefined

  return {
    isValid: true,
    userId: user.id,
    email: user.email,
    tenantId,
  }
}

/**
 * Validates API request - checks API key and optionally Bearer token
 * @param request - The incoming request
 * @param requireAuth - Whether user authentication is required
 */
export async function validateApiRequest(
  request: NextRequest,
  requireAuth = true
): Promise<ApiAuthContext> {
  // 1. Always validate API key first
  if (!validateApiKey(request)) {
    return {
      isValid: false,
      error: 'Invalid or missing API key',
    }
  }

  // 2. Check if this route requires authentication
  const pathname = request.nextUrl.pathname
  const isPublicApiRoute = API_PUBLIC_ROUTES.some(route => pathname === route)

  if (!requireAuth || isPublicApiRoute) {
    return { isValid: true }
  }

  // 3. Validate Bearer token for authenticated routes
  return validateBearerToken(request)
}

/**
 * Creates a Supabase client authenticated with the user's token
 * Use this in API routes to perform operations as the authenticated user
 */
export function createApiClient(token: string) {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

/**
 * Extracts the Bearer token from request headers
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.replace('Bearer ', '')
}

/**
 * Extracts tenant ID from request headers or JWT
 */
export function extractTenantId(request: NextRequest, context?: ApiAuthContext): string | null {
  // First try from header
  const headerTenantId = request.headers.get(API_HEADERS.TENANT_ID)
  if (headerTenantId) {
    return headerTenantId
  }

  // Then try from auth context (extracted from JWT)
  if (context?.tenantId) {
    return context.tenantId
  }

  return null
}

/**
 * Gets the organization ID for a user from their profile
 */
async function getOrganizationIdForUser(userId: string): Promise<string | null> {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single()

  return profile?.organization_id || null
}

/**
 * Validates API access and rate limits for an authenticated request
 * @param organizationId - The organization making the API request
 * @param isWriteOperation - Whether this is a write operation (counts double against rate limit)
 * @returns AuthContext with rate limit info or error
 */
export async function checkApiLimits(
  organizationId: string,
  isWriteOperation = false
): Promise<{
  allowed: boolean
  error?: string
  errorCode?: 'FORBIDDEN' | 'RATE_LIMIT_EXCEEDED'
  rateLimitInfo?: {
    used: number
    remaining: number
    dailyLimit: number
  }
}> {
  // 1. Check if organization has API access in their plan
  const accessCheck = await checkApiAccess(organizationId)
  if (!accessCheck.allowed) {
    return {
      allowed: false,
      error: accessCheck.message || 'API access not available on your plan',
      errorCode: 'FORBIDDEN',
    }
  }

  // 2. Check rate limit
  const rateLimitCheck = await checkApiRateLimit(organizationId)
  if (!rateLimitCheck.allowed) {
    return {
      allowed: false,
      error: rateLimitCheck.message || 'Rate limit exceeded',
      errorCode: 'RATE_LIMIT_EXCEEDED',
      rateLimitInfo: {
        used: rateLimitCheck.used,
        remaining: 0,
        dailyLimit: rateLimitCheck.dailyLimit,
      },
    }
  }

  // 3. Consume the request
  const consumeResult = await consumeApiRequest(organizationId, isWriteOperation)

  return {
    allowed: true,
    rateLimitInfo: {
      used: rateLimitCheck.used + 1,
      remaining: consumeResult.remaining,
      dailyLimit: rateLimitCheck.dailyLimit,
    },
  }
}

/**
 * Full API validation including rate limits
 * Use this for API routes that need rate limiting
 * @param request - The incoming request
 * @param options - Options for validation
 */
export async function validateApiRequestWithLimits(
  request: NextRequest,
  options: {
    requireAuth?: boolean
    checkRateLimits?: boolean
    isWriteOperation?: boolean
  } = {}
): Promise<ApiAuthContext> {
  const { requireAuth = true, checkRateLimits = true, isWriteOperation = false } = options

  // 1. Perform standard API validation
  const authContext = await validateApiRequest(request, requireAuth)

  if (!authContext.isValid) {
    return authContext
  }

  // 2. If not checking rate limits or no user, return early
  if (!checkRateLimits || !authContext.userId) {
    return authContext
  }

  // 3. Get organization ID
  const organizationId = await getOrganizationIdForUser(authContext.userId)
  if (!organizationId) {
    return {
      ...authContext,
      error: 'User not associated with an organization',
      isValid: false,
    }
  }

  authContext.organizationId = organizationId

  // 4. Check API limits
  const limitsCheck = await checkApiLimits(organizationId, isWriteOperation)

  if (!limitsCheck.allowed) {
    return {
      ...authContext,
      isValid: false,
      error: limitsCheck.error,
      rateLimitInfo: limitsCheck.rateLimitInfo,
    }
  }

  return {
    ...authContext,
    rateLimitInfo: limitsCheck.rateLimitInfo,
  }
}
