export const APP_NAME = 'GymGo'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ONBOARDING: '/onboarding',
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
} as const

export const API_ROUTES = {
  V1: {
    AUTH: {
      LOGIN: '/api/v1/auth/login',
      REGISTER: '/api/v1/auth/register',
      REFRESH: '/api/v1/auth/refresh',
      LOGOUT: '/api/v1/auth/logout',
      ME: '/api/v1/auth/me',
    },
    MEMBERS: '/api/v1/members',
    WORKOUTS: '/api/v1/workouts',
    CLASSES: '/api/v1/classes',
    AI: {
      CHAT: '/api/v1/ai/chat',
    },
  },
} as const

export const PUBLIC_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  '/auth/callback',
  '/auth/accept-invitation',
  '/auth/reset-password',
] as const

// Routes that require authentication but not organization setup
export const ONBOARDING_ROUTES = [
  ROUTES.ONBOARDING,
] as const

// API routes that require API key but NOT user authentication
export const API_PUBLIC_ROUTES = [
  API_ROUTES.V1.AUTH.LOGIN,
  API_ROUTES.V1.AUTH.REGISTER,
  API_ROUTES.V1.AUTH.REFRESH,
] as const

export const QUERY_KEYS = {
  USER: 'user',
  PROFILE: 'profile',
} as const

export const API_HEADERS = {
  API_KEY: 'X-API-Key',
  TENANT_ID: 'X-Tenant-ID',
} as const
