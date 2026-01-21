/**
 * GymGo SaaS Pricing Configuration
 *
 * Infrastructure costs breakdown (approximate):
 *
 * SUPABASE (per project):
 * - Free: 500MB DB, 1GB storage, 50K auth users
 * - Pro: $25/mo - 8GB DB, 100GB storage
 *
 * OPENAI:
 * - GPT-3.5-turbo: ~$0.002/1K tokens (~$0.001-0.003 per request)
 * - GPT-4: ~$0.03-0.06/1K tokens
 * - Average AI request cost: ~$0.005
 *
 * RESEND:
 * - Free: 3,000 emails/month
 * - Pro: $20/mo for 50,000 emails
 * - Per email cost: ~$0.0004
 *
 * TWILIO/WHATSAPP:
 * - Template message: ~$0.005-0.02
 * - Session message: ~$0.02-0.08
 * - Average: ~$0.03 per conversation
 *
 * VERCEL:
 * - Pro: $20/mo per team member
 * - Bandwidth: 1TB included
 *
 * MARGIN TARGET: 70-80% gross margin
 */

// =============================================================================
// TYPES
// =============================================================================

export type PlanTier = 'free' | 'starter' | 'growth' | 'pro' | 'enterprise'

export interface PlanLimits {
  // Members
  maxMembers: number
  maxActiveMembers: number

  // Team
  maxUsers: number
  maxTrainers: number

  // Classes & Schedules
  maxClasses: number
  maxClassesPerDay: number

  // AI Features
  aiRequestsPerMonth: number
  aiModel: 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo'
  routineGenerationsPerMonth: number
  exerciseAlternativesPerMonth: number

  // Communications
  emailsPerMonth: number
  whatsappMessagesPerMonth: number
  pushNotificationsPerMonth: number

  // Storage
  storageGB: number
  maxFileUploadMB: number

  // Integrations
  apiAccess: boolean
  apiRequestsPerDay: number
  webhooks: boolean
  maxWebhooks: number

  // Features
  customBranding: boolean
  whiteLabel: boolean
  advancedReports: boolean
  exportData: boolean
  multiLocation: boolean
  maxLocations: number

  // Support
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated'
  slaGuarantee: boolean
}

export interface PricingPlan {
  id: PlanTier
  name: string
  description: string
  priceMonthlyUSD: number
  priceYearlyUSD: number // 20% discount
  priceMonthlyMXN: number
  priceYearlyMXN: number
  limits: PlanLimits
  popular?: boolean
  features: string[]
  notIncluded?: string[]
}

// =============================================================================
// PLAN CONFIGURATIONS
// =============================================================================

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    // Members
    maxMembers: 15,
    maxActiveMembers: 15,

    // Team
    maxUsers: 1,
    maxTrainers: 2,

    // Classes & Schedules
    maxClasses: -1, // Unlimited
    maxClassesPerDay: -1, // Unlimited

    // AI Features - Very limited
    aiRequestsPerMonth: 10,
    aiModel: 'gpt-3.5-turbo',
    routineGenerationsPerMonth: 5,
    exerciseAlternativesPerMonth: 10,

    // Communications
    emailsPerMonth: 100,
    whatsappMessagesPerMonth: 0,
    pushNotificationsPerMonth: 100,

    // Storage
    storageGB: 0.5,
    maxFileUploadMB: 2,

    // Integrations
    apiAccess: false,
    apiRequestsPerDay: 0,
    webhooks: false,
    maxWebhooks: 0,

    // Features
    customBranding: false,
    whiteLabel: false,
    advancedReports: false,
    exportData: false,
    multiLocation: false,
    maxLocations: 1,

    // Support
    supportLevel: 'community',
    slaGuarantee: false,
  },

  starter: {
    // Members
    maxMembers: 50,
    maxActiveMembers: 50,

    // Team
    maxUsers: 2,
    maxTrainers: -1, // Unlimited

    // Classes & Schedules
    maxClasses: -1, // Unlimited
    maxClassesPerDay: -1, // Unlimited

    // AI Features - Basic
    aiRequestsPerMonth: 100,
    aiModel: 'gpt-3.5-turbo',
    routineGenerationsPerMonth: 20,
    exerciseAlternativesPerMonth: 50,

    // Communications
    emailsPerMonth: 500,
    whatsappMessagesPerMonth: 50,
    pushNotificationsPerMonth: 500,

    // Storage
    storageGB: 2,
    maxFileUploadMB: 5,

    // Integrations
    apiAccess: false,
    apiRequestsPerDay: 0,
    webhooks: false,
    maxWebhooks: 0,

    // Features
    customBranding: false,
    whiteLabel: false,
    advancedReports: false,
    exportData: true,
    multiLocation: false,
    maxLocations: 1,

    // Support
    supportLevel: 'email',
    slaGuarantee: false,
  },

  growth: {
    // Members
    maxMembers: 150,
    maxActiveMembers: 150,

    // Team
    maxUsers: 5,
    maxTrainers: -1, // Unlimited

    // Classes & Schedules
    maxClasses: -1, // Unlimited
    maxClassesPerDay: -1, // Unlimited

    // AI Features - Moderate
    aiRequestsPerMonth: 300,
    aiModel: 'gpt-3.5-turbo',
    routineGenerationsPerMonth: 50,
    exerciseAlternativesPerMonth: 150,

    // Communications
    emailsPerMonth: 2000,
    whatsappMessagesPerMonth: 200,
    pushNotificationsPerMonth: 2000,

    // Storage
    storageGB: 5,
    maxFileUploadMB: 10,

    // Integrations
    apiAccess: false,
    apiRequestsPerDay: 0,
    webhooks: false,
    maxWebhooks: 0,

    // Features
    customBranding: true,
    whiteLabel: false,
    advancedReports: true,
    exportData: true,
    multiLocation: false,
    maxLocations: 1,

    // Support
    supportLevel: 'email',
    slaGuarantee: false,
  },

  pro: {
    // Members
    maxMembers: -1, // Unlimited
    maxActiveMembers: -1,

    // Team
    maxUsers: -1, // Unlimited
    maxTrainers: -1, // Unlimited

    // Classes & Schedules
    maxClasses: -1, // Unlimited
    maxClassesPerDay: -1, // Unlimited

    // AI Features - Full
    aiRequestsPerMonth: 1000,
    aiModel: 'gpt-4-turbo',
    routineGenerationsPerMonth: 200,
    exerciseAlternativesPerMonth: 500,

    // Communications
    emailsPerMonth: 5000,
    whatsappMessagesPerMonth: 500,
    pushNotificationsPerMonth: 5000,

    // Storage
    storageGB: 15,
    maxFileUploadMB: 25,

    // Integrations
    apiAccess: true,
    apiRequestsPerDay: 1000,
    webhooks: true,
    maxWebhooks: 5,

    // Features
    customBranding: true,
    whiteLabel: false,
    advancedReports: true,
    exportData: true,
    multiLocation: true,
    maxLocations: 3,

    // Support
    supportLevel: 'priority',
    slaGuarantee: false,
  },

  enterprise: {
    // Members
    maxMembers: -1, // Unlimited
    maxActiveMembers: -1,

    // Team
    maxUsers: -1,
    maxTrainers: -1,

    // Classes & Schedules
    maxClasses: -1,
    maxClassesPerDay: -1,

    // AI Features - Unlimited with best model
    aiRequestsPerMonth: -1,
    aiModel: 'gpt-4-turbo',
    routineGenerationsPerMonth: -1,
    exerciseAlternativesPerMonth: -1,

    // Communications
    emailsPerMonth: -1,
    whatsappMessagesPerMonth: -1,
    pushNotificationsPerMonth: -1,

    // Storage
    storageGB: 100,
    maxFileUploadMB: 100,

    // Integrations
    apiAccess: true,
    apiRequestsPerDay: -1,
    webhooks: true,
    maxWebhooks: -1,

    // Features
    customBranding: true,
    whiteLabel: true,
    advancedReports: true,
    exportData: true,
    multiLocation: true,
    maxLocations: -1,

    // Support
    supportLevel: 'dedicated',
    slaGuarantee: true,
  },
}

// =============================================================================
// PRICING PLANS
// =============================================================================

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Gratis',
    description: 'Perfecto para probar GymGo o para entrenadores personales.',
    priceMonthlyUSD: 0,
    priceYearlyUSD: 0,
    priceMonthlyMXN: 0,
    priceYearlyMXN: 0,
    limits: PLAN_LIMITS.free,
    features: [
      'Hasta 15 miembros',
      '1 usuario admin',
      '2 entrenadores',
      'Clases ilimitadas',
      'Gestión de miembros',
      'Control de pagos',
      'Check-in digital',
      '10 consultas AI/mes',
      '100 emails/mes',
      'App para miembros',
      'Soporte comunidad',
    ],
    notIncluded: [
      'WhatsApp',
      'Branding personalizado',
      'Reportes avanzados',
      'Acceso API',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Ideal para gimnasios pequeños o boxes que inician.',
    priceMonthlyUSD: 19,
    priceYearlyUSD: 182, // ~$15.17/mo (20% off)
    priceMonthlyMXN: 349,
    priceYearlyMXN: 3350, // ~20% off
    limits: PLAN_LIMITS.starter,
    features: [
      'Hasta 50 miembros',
      '2 usuarios del sistema',
      'Entrenadores ilimitados',
      'Clases ilimitadas',
      'Gestión de miembros',
      'Control de pagos',
      'Check-in digital',
      '100 consultas AI/mes',
      '500 emails/mes',
      '50 mensajes WhatsApp/mes',
      'Exportar datos',
      'App para miembros',
      'Soporte por email',
    ],
    notIncluded: [
      'Branding personalizado',
      'Reportes avanzados',
      'Acceso API',
      'Multi-ubicación',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'Para gimnasios en crecimiento con más miembros y comunicación.',
    priceMonthlyUSD: 39,
    priceYearlyUSD: 374, // ~$31.17/mo (20% off)
    priceMonthlyMXN: 699,
    priceYearlyMXN: 6710, // ~20% off
    limits: PLAN_LIMITS.growth,
    popular: true,
    features: [
      'Hasta 150 miembros',
      '5 usuarios del sistema',
      'Entrenadores ilimitados',
      'Clases ilimitadas',
      '300 consultas AI/mes',
      '2,000 emails/mes',
      '200 mensajes WhatsApp/mes',
      'Branding personalizado',
      'Reportes avanzados',
      'Exportar datos',
      'Soporte por email',
    ],
    notIncluded: [
      'Acceso API',
      'Multi-ubicación',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Todo ilimitado para gimnasios establecidos y múltiples ubicaciones.',
    priceMonthlyUSD: 59,
    priceYearlyUSD: 566, // ~$47.17/mo (20% off)
    priceMonthlyMXN: 999,
    priceYearlyMXN: 9590, // ~20% off
    limits: PLAN_LIMITS.pro,
    features: [
      'Miembros ilimitados',
      'Usuarios ilimitados',
      'Entrenadores ilimitados',
      'Clases ilimitadas',
      '1,000 consultas AI/mes (GPT-4)',
      '5,000 emails/mes',
      '500 mensajes WhatsApp/mes',
      'Reportes avanzados',
      'Acceso API (1,000 req/día)',
      'Webhooks (5 endpoints)',
      'Hasta 3 ubicaciones',
      'Soporte prioritario',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Solución completa para cadenas de gimnasios y franquicias.',
    priceMonthlyUSD: 0, // Custom pricing
    priceYearlyUSD: 0,
    priceMonthlyMXN: 0,
    priceYearlyMXN: 0,
    limits: PLAN_LIMITS.enterprise,
    features: [
      'Todo en Pro, más:',
      'AI ilimitado (GPT-4)',
      'Comunicaciones ilimitadas',
      'White-label completo',
      'API sin límites',
      'Webhooks ilimitados',
      'Ubicaciones ilimitadas',
      'SLA garantizado 99.9%',
      'Soporte dedicado 24/7',
      'Onboarding personalizado',
      'Integraciones custom',
    ],
  },
]

// =============================================================================
// COST CALCULATIONS (for internal use)
// =============================================================================

/**
 * Estimated infrastructure costs per plan per month
 * Used for margin calculations
 */
export const ESTIMATED_COSTS_USD: Record<PlanTier, number> = {
  free: 1, // ~$1/mo (minimal usage, shared infrastructure)
  starter: 4, // ~$4/mo (minimal Supabase, few AI calls, minimal email)
  growth: 10, // ~$10/mo (moderate AI, WhatsApp, shared Supabase)
  pro: 20, // ~$20/mo (GPT-4 AI, WhatsApp, more storage)
  enterprise: 100, // ~$100+/mo (dedicated resources, unlimited usage)
}

/**
 * Per-unit overage pricing (when limits exceeded)
 */
export const OVERAGE_PRICING = {
  // Members
  additionalMembers: {
    pricePerMemberUSD: 0.5,
    pricePerMemberMXN: 9,
  },

  // AI
  additionalAIRequests: {
    pricePer100USD: 1,
    pricePer100MXN: 18,
  },

  // Communications
  additionalEmails: {
    pricePer1000USD: 1,
    pricePer1000MXN: 18,
  },
  additionalWhatsApp: {
    pricePerMessageUSD: 0.05,
    pricePerMessageMXN: 0.9,
  },

  // Storage
  additionalStorageGB: {
    pricePerGBUSD: 2,
    pricePerGBMXN: 35,
  },

  // API
  additionalAPIRequests: {
    pricePer1000USD: 0.5,
    pricePer1000MXN: 9,
  },
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get plan by ID
 */
export function getPlanById(planId: PlanTier): PricingPlan | undefined {
  return PRICING_PLANS.find((p) => p.id === planId)
}

/**
 * Get plan limits by ID
 */
export function getPlanLimits(planId: PlanTier): PlanLimits {
  return PLAN_LIMITS[planId]
}

/**
 * Check if a value is within limit (-1 means unlimited)
 */
export function isWithinLimit(current: number, limit: number): boolean {
  if (limit === -1) return true
  return current < limit
}

/**
 * Get usage percentage (returns 100 for unlimited)
 */
export function getUsagePercentage(current: number, limit: number): number {
  if (limit === -1) return 0
  if (limit === 0) return 100
  return Math.min(100, Math.round((current / limit) * 100))
}

/**
 * Format limit for display
 */
export function formatLimit(limit: number): string {
  if (limit === -1) return 'Ilimitado'
  return limit.toLocaleString()
}

/**
 * Calculate yearly savings
 */
export function calculateYearlySavings(plan: PricingPlan): {
  savingsUSD: number
  savingsMXN: number
  savingsPercent: number
} {
  const monthlyTotalUSD = plan.priceMonthlyUSD * 12
  const monthlyTotalMXN = plan.priceMonthlyMXN * 12

  return {
    savingsUSD: monthlyTotalUSD - plan.priceYearlyUSD,
    savingsMXN: monthlyTotalMXN - plan.priceYearlyMXN,
    savingsPercent: 20,
  }
}
