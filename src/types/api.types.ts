/**
 * API Response Types for Mobile/Flutter Apps
 */

// =============================================================================
// Base Response Types
// =============================================================================

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

export interface ApiSuccessResponse<T> {
  success: true
  data: T
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// =============================================================================
// Auth Types
// =============================================================================

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: 'Bearer'
  expires_in: number
  expires_at: number
}

export interface ApiUser {
  id: string
  email: string
  name: string | null
  tenant_id: string | null
  role: string | null
  created_at: string
  avatar_url?: string | null
}

export interface AuthResponseData {
  user: ApiUser
  tokens: AuthTokens
}

// =============================================================================
// Request Types
// =============================================================================

export interface LoginRequest {
  email: string
  password: string
  tenant_slug?: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  tenant_slug?: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}

// =============================================================================
// Pagination Types
// =============================================================================

export interface PaginationParams {
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// =============================================================================
// API Context Types
// =============================================================================

export interface ApiRequestContext {
  userId?: string
  tenantId?: string
  email?: string
}
