import { type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateApiKey } from '@/lib/api/auth'
import { invalidApiKeyError, validationError, conflictError, internalError } from '@/lib/api/errors'
import { apiCreated } from '@/lib/api/response'
import { apiRegisterSchema } from '@/schemas/api.schema'
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
    const validated = apiRegisterSchema.safeParse(body)

    if (!validated.success) {
      return validationError(validated.error)
    }

    const { name, email, password, tenant_slug } = validated.data

    // 3. Register with Supabase
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          tenant_slug,
        },
      },
    })

    if (error) {
      // Handle duplicate email
      if (error.message.includes('already registered')) {
        return conflictError('An account with this email already exists')
      }
      return internalError(error.message)
    }

    if (!data.user) {
      return internalError('Registration failed')
    }

    // 4. Build response
    // Note: If email confirmation is required, session will be null
    const response: AuthResponseData = {
      user: {
        id: data.user.id,
        email: data.user.email!,
        name: name,
        tenant_id: data.user.user_metadata?.tenant_id || null,
        role: data.user.user_metadata?.role || null,
        created_at: data.user.created_at,
        avatar_url: null,
      },
      tokens: data.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            token_type: 'Bearer',
            expires_in: data.session.expires_in!,
            expires_at: data.session.expires_at!,
          }
        : {
            // Placeholder when email confirmation is required
            access_token: '',
            refresh_token: '',
            token_type: 'Bearer',
            expires_in: 0,
            expires_at: 0,
          },
    }

    return apiCreated(response)
  } catch (error) {
    console.error('Register error:', error)
    return internalError()
  }
}
