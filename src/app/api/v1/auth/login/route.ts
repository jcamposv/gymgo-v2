import { type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateApiKey } from '@/lib/api/auth'
import { invalidApiKeyError, validationError, unauthorizedError, internalError } from '@/lib/api/errors'
import { apiSuccess } from '@/lib/api/response'
import { apiLoginSchema } from '@/schemas/api.schema'
import type { Database } from '@/types/database.types'
import type { AuthResponseData } from '@/types/api.types'

export async function POST(request: NextRequest) {
  try {
    // 1. Validate API key
    if (!validateApiKey(request)) {
      return invalidApiKeyError()
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const validated = apiLoginSchema.safeParse(body)

    if (!validated.success) {
      return validationError(validated.error)
    }

    const { email, password } = validated.data

    // 3. Authenticate with Supabase
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return unauthorizedError(error.message)
    }

    if (!data.user || !data.session) {
      return unauthorizedError('Authentication failed')
    }

    // 4. Build response
    const response: AuthResponseData = {
      user: {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name || null,
        tenant_id: data.user.user_metadata?.tenant_id || null,
        role: data.user.user_metadata?.role || null,
        created_at: data.user.created_at,
        avatar_url: data.user.user_metadata?.avatar_url || null,
      },
      tokens: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        token_type: 'Bearer',
        expires_in: data.session.expires_in!,
        expires_at: data.session.expires_at!,
      },
    }

    return apiSuccess(response)
  } catch (error) {
    console.error('Login error:', error)
    return internalError()
  }
}
