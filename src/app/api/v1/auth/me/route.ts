import { type NextRequest } from 'next/server'
import { validateApiRequest, createApiClient, extractToken } from '@/lib/api/auth'
import { invalidApiKeyError, unauthorizedError, internalError } from '@/lib/api/errors'
import { apiSuccess } from '@/lib/api/response'
import type { ApiUser } from '@/types/api.types'

export async function GET(request: NextRequest) {
  try {
    // 1. Validate API key and Bearer token
    const authContext = await validateApiRequest(request, true)

    if (!authContext.isValid) {
      if (authContext.error?.includes('API key')) {
        return invalidApiKeyError()
      }
      return unauthorizedError(authContext.error)
    }

    // 2. Get user details
    const token = extractToken(request)

    if (!token) {
      return unauthorizedError('Missing authorization token')
    }

    const supabase = createApiClient(token)
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return unauthorizedError(error?.message || 'User not found')
    }

    // 3. Build response
    const apiUser: ApiUser = {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || null,
      tenant_id: user.user_metadata?.tenant_id || null,
      role: user.user_metadata?.role || null,
      created_at: user.created_at,
      avatar_url: user.user_metadata?.avatar_url || null,
    }

    return apiSuccess({ user: apiUser })
  } catch (error) {
    console.error('Get user error:', error)
    return internalError()
  }
}
