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

export type PlanTier = 'starter' | 'growth' | 'pro' | 'enterprise'

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

    // AI Features - Very limited
    aiRequestsPerMonth: 50,
    aiModel: 'gpt-3.5-turbo',
    routineGenerationsPerMonth: 10,
    exerciseAlternativesPerMonth: 20,

    // Communications
    emailsPerMonth: 500,
    whatsappMessagesPerMonth: 50,
    pushNotificationsPerMonth: 500,

    // Storage
    storageGB: 1,
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
    exportData: false,
    multiLocation: false,
    maxLocations: 1,

    // Support
    supportLevel: 'community',
    slaGuarantee: false,
  },

  growth: {
    // Members
    maxMembers: 200,
    maxActiveMembers: 200,

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
    exerciseAlternativesPerMonth: 100,

    // Communications
    emailsPerMonth: 3000,
    whatsappMessagesPerMonth: 500,
    pushNotificationsPerMonth: 3000,

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
    advancedReports: false,
    exportData: true,
    multiLocation: false,
    maxLocations: 1,

    // Support
    supportLevel: 'email',
    slaGuarantee: false,
  },

  pro: {
    // Members
    maxMembers: 500,
    maxActiveMembers: 500,

    // Team
    maxUsers: 15,
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
    emailsPerMonth: 10000,
    whatsappMessagesPerMonth: 2000,
    pushNotificationsPerMonth: 10000,

    // Storage
    storageGB: 20,
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
    id: 'starter',
    name: 'Starter',
    description: 'Ideal para gimnasios pequeños o entrenadores personales que inician.',
    priceMonthlyUSD: 29,
    priceYearlyUSD: 278, // $23.17/mo (20% off)
    priceMonthlyMXN: 499,
    priceYearlyMXN: 4790, // ~20% off
    limits: PLAN_LIMITS.starter,
    features: [
      'Hasta 50 miembros',
      '2 usuarios del sistema',
      'Entrenadores ilimitados',
      'Clases ilimitadas',
      'Gestión de miembros',
      'Control de pagos',
      'Check-in digital',
      '50 consultas AI/mes',
      '500 emails/mes',
      '50 mensajes WhatsApp/mes',
      'App para miembros',
      'Soporte por comunidad',
    ],
    notIncluded: [
      'Reportes avanzados',
      'Acceso API',
      'Multi-ubicación',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'Para gimnasios en crecimiento que necesitan más capacidad y comunicación.',
    priceMonthlyUSD: 79,
    priceYearlyUSD: 758, // $63.17/mo (20% off)
    priceMonthlyMXN: 1399,
    priceYearlyMXN: 13430,
    limits: PLAN_LIMITS.growth,
    popular: true,
    features: [
      'Hasta 200 miembros',
      '5 usuarios del sistema',
      'Entrenadores ilimitados',
      'Clases ilimitadas',
      '300 consultas AI/mes',
      '3,000 emails/mes',
      '500 mensajes WhatsApp/mes',
      'Branding personalizado',
      'Exportar datos',
      'Soporte por email',
    ],
    notIncluded: [
      'Reportes avanzados',
      'Acceso API',
      'Multi-ubicación',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para gimnasios establecidos con múltiples ubicaciones y equipos grandes.',
    priceMonthlyUSD: 149,
    priceYearlyUSD: 1430, // $119.17/mo (20% off)
    priceMonthlyMXN: 2599,
    priceYearlyMXN: 24950,
    limits: PLAN_LIMITS.pro,
    features: [
      'Hasta 500 miembros',
      '15 usuarios del sistema',
      'Entrenadores ilimitados',
      'Clases ilimitadas',
      '1,000 consultas AI/mes (GPT-4)',
      '10,000 emails/mes',
      '2,000 mensajes WhatsApp/mes',
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
      'Miembros ilimitados',
      'Usuarios ilimitados',
      'Clases ilimitadas',
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
  starter: 5, // ~$5/mo (minimal Supabase, few AI calls, minimal email)
  growth: 20, // ~$20/mo (Supabase Pro share, moderate AI, WhatsApp)
  pro: 50, // ~$50/mo (Supabase Pro, heavy AI/GPT-4, WhatsApp, storage)
  enterprise: 150, // ~$150+/mo (dedicated resources, unlimited usage)
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
