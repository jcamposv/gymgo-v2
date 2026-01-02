import { type NextRequest } from 'next/server'
import { validateApiRequest, createApiClient, extractToken } from '@/lib/api/auth'
import { invalidApiKeyError, unauthorizedError, internalError } from '@/lib/api/errors'
import { apiNoContent } from '@/lib/api/response'

export async function POST(request: NextRequest) {
  try {
    // 1. Validate API key and Bearer token
    const authContext = await validateApiRequest(request, true)

    if (!authContext.isValid) {
      if (authContext.error?.includes('API key')) {
        return invalidApiKeyError()
      }
      return unauthorizedError(authContext.error)
    }

    // 2. Get token and sign out
    const token = extractToken(request)

    if (!token) {
      return unauthorizedError('Missing authorization token')
    }

    const supabase = createApiClient(token)
    await supabase.auth.signOut()

    return apiNoContent()
  } catch (error) {
    console.error('Logout error:', error)
    return internalError()
  }
}
