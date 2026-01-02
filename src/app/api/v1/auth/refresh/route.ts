import { type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateApiKey } from '@/lib/api/auth'
import { invalidApiKeyError, validationError, expiredTokenError, internalError } from '@/lib/api/errors'
import { apiSuccess } from '@/lib/api/response'
import { apiRefreshTokenSchema } from '@/schemas/api.schema'
import type { Database } from '@/types/database.types'
import type { AuthTokens } from '@/types/api.types'

export async function POST(request: NextRequest) {
  try {
    // 1. Validate API key
    if (!validateApiKey(request)) {
      return invalidApiKeyError()
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const validated = apiRefreshTokenSchema.safeParse(body)

    if (!validated.success) {
      return validationError(validated.error)
    }

    const { refresh_token } = validated.data

    // 3. Refresh session with Supabase
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    })

    if (error) {
      return expiredTokenError()
    }

    if (!data.session) {
      return expiredTokenError()
    }

    // 4. Build response
    const tokens: AuthTokens = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      token_type: 'Bearer',
      expires_in: data.session.expires_in!,
      expires_at: data.session.expires_at!,
    }

    return apiSuccess({ tokens })
  } catch (error) {
    console.error('Refresh token error:', error)
    return internalError()
  }
}
