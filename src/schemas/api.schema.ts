import { z } from 'zod'

// =============================================================================
// Auth Schemas
// =============================================================================

export const apiLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Minimum 8 characters'),
  tenant_slug: z.string().min(1, 'Tenant slug is required').optional(),
})

export const apiRegisterSchema = z.object({
  name: z
    .string()
    .min(2, 'Minimum 2 characters')
    .max(50, 'Maximum 50 characters'),
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Must include uppercase')
    .regex(/[a-z]/, 'Must include lowercase')
    .regex(/[0-9]/, 'Must include number'),
  tenant_slug: z.string().min(1, 'Tenant slug is required').optional(),
})

export const apiRefreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
})

// =============================================================================
// Response Schemas
// =============================================================================

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.array(z.string())).optional(),
  }),
})

export const apiSuccessSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  })

// =============================================================================
// Auth Response Schemas
// =============================================================================

export const authTokensSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.literal('Bearer'),
  expires_in: z.number(),
  expires_at: z.number(),
})

export const apiUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  tenant_id: z.string().uuid().nullable(),
  role: z.string().nullable(),
  created_at: z.string(),
})

export const authResponseSchema = z.object({
  user: apiUserSchema,
  tokens: authTokensSchema,
})

// =============================================================================
// Type Exports
// =============================================================================

export type ApiLoginData = z.infer<typeof apiLoginSchema>
export type ApiRegisterData = z.infer<typeof apiRegisterSchema>
export type ApiRefreshTokenData = z.infer<typeof apiRefreshTokenSchema>
export type ApiError = z.infer<typeof apiErrorSchema>
export type AuthTokens = z.infer<typeof authTokensSchema>
export type ApiUser = z.infer<typeof apiUserSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
