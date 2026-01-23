/**
 * Plan Limits Enforcement
 *
 * Utilities for checking and enforcing plan-based limits
 */

import { createClient } from '@/lib/supabase/server'
import { PLAN_LIMITS, type PlanTier } from '@/lib/pricing.config'

// Helper for untyped RPC calls (for functions not yet in database.types.ts)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const callRpc = async (supabase: Awaited<ReturnType<typeof createClient>>, name: string, params?: Record<string, unknown>): Promise<{ data: any; error: any }> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.rpc as any)(name, params)
}

// =============================================================================
// TYPES
// =============================================================================

export interface LimitCheckResult {
  allowed: boolean
  current: number
  limit: number
  message?: string
}

// Standardized error code for plan limit violations
export const PLAN_LIMIT_ERROR_CODE = 'PLAN_LIMIT_EXCEEDED' as const

export interface PlanLimitError {
  code: typeof PLAN_LIMIT_ERROR_CODE
  limitType: string
  message: string
  current: number
  limit: number
  resetDate?: string
}

export function createPlanLimitError(
  limitType: string,
  message: string,
  current: number,
  limit: number,
  resetDate?: string
): PlanLimitError {
  return {
    code: PLAN_LIMIT_ERROR_CODE,
    limitType,
    message,
    current,
    limit,
    resetDate,
  }
}

export interface OrganizationLimits {
  plan: PlanTier
  maxMembers: number
  maxUsers: number
  maxLocations: number
  features: Record<string, boolean>
}

// =============================================================================
// GET ORGANIZATION LIMITS
// =============================================================================

export async function getOrganizationLimits(
  organizationId: string
): Promise<OrganizationLimits | null> {
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_plan, max_members, max_admin_users, max_locations, features')
    .eq('id', organizationId)
    .single()

  if (!org) return null

  const plan = (org.subscription_plan || 'starter') as PlanTier
  const planLimits = PLAN_LIMITS[plan]

  return {
    plan,
    maxMembers: org.max_members || planLimits.maxMembers,
    maxUsers: org.max_admin_users || planLimits.maxUsers,
    maxLocations: org.max_locations || planLimits.maxLocations,
    features: (org.features as Record<string, boolean>) || {},
  }
}

// =============================================================================
// CHECK MEMBER LIMIT
// =============================================================================

export async function checkMemberLimit(
  organizationId: string
): Promise<LimitCheckResult> {
  const supabase = await createClient()

  // Get org limits
  const limits = await getOrganizationLimits(organizationId)
  if (!limits) {
    return { allowed: false, current: 0, limit: 0, message: 'Organización no encontrada' }
  }

  // Unlimited check
  if (limits.maxMembers === -1 || limits.maxMembers >= 999999) {
    return { allowed: true, current: 0, limit: -1 }
  }

  // Count current members
  const { count, error } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  if (error) {
    console.error('Error counting members:', error)
    return { allowed: false, current: 0, limit: limits.maxMembers, message: 'Error al verificar límites' }
  }

  const currentCount = count || 0

  if (currentCount >= limits.maxMembers) {
    return {
      allowed: false,
      current: currentCount,
      limit: limits.maxMembers,
      message: `Has alcanzado el límite de ${limits.maxMembers} miembros de tu plan. Actualiza tu plan para agregar más.`,
    }
  }

  return {
    allowed: true,
    current: currentCount,
    limit: limits.maxMembers,
  }
}

// =============================================================================
// CHECK USER LIMIT (System users: admin, assistant, nutritionist - NOT trainers)
// =============================================================================

// Roles that count against maxUsers limit
const SYSTEM_USER_ROLES = ['owner', 'admin', 'assistant', 'nutritionist'] as const

// Roles that count against maxTrainers limit
const TRAINER_ROLES = ['trainer', 'instructor'] as const

export async function checkUserLimit(
  organizationId: string
): Promise<LimitCheckResult> {
  const supabase = await createClient()

  const limits = await getOrganizationLimits(organizationId)
  if (!limits) {
    return { allowed: false, current: 0, limit: 0, message: 'Organización no encontrada' }
  }

  // Unlimited check
  if (limits.maxUsers === -1 || limits.maxUsers >= 999) {
    return { allowed: true, current: 0, limit: -1 }
  }

  // Count current system users (excluding trainers - they have separate limit)
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .in('role', SYSTEM_USER_ROLES)

  if (error) {
    console.error('Error counting users:', error)
    return { allowed: false, current: 0, limit: limits.maxUsers, message: 'Error al verificar límites' }
  }

  const currentCount = count || 0

  if (currentCount >= limits.maxUsers) {
    return {
      allowed: false,
      current: currentCount,
      limit: limits.maxUsers,
      message: `Has alcanzado el límite de ${limits.maxUsers} usuarios del sistema de tu plan. Actualiza tu plan para agregar más.`,
    }
  }

  return {
    allowed: true,
    current: currentCount,
    limit: limits.maxUsers,
  }
}

// =============================================================================
// CHECK TRAINER LIMIT
// =============================================================================

export async function checkTrainerLimit(
  organizationId: string
): Promise<LimitCheckResult> {
  const supabase = await createClient()

  const limits = await getOrganizationLimits(organizationId)
  if (!limits) {
    return { allowed: false, current: 0, limit: 0, message: 'Organización no encontrada' }
  }

  const planLimits = PLAN_LIMITS[limits.plan]

  // Unlimited check
  if (planLimits.maxTrainers === -1) {
    return { allowed: true, current: 0, limit: -1 }
  }

  // Count current trainers
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .in('role', TRAINER_ROLES)

  if (error) {
    console.error('Error counting trainers:', error)
    return { allowed: false, current: 0, limit: planLimits.maxTrainers, message: 'Error al verificar límites' }
  }

  const currentCount = count || 0

  if (currentCount >= planLimits.maxTrainers) {
    return {
      allowed: false,
      current: currentCount,
      limit: planLimits.maxTrainers,
      message: `Has alcanzado el límite de ${planLimits.maxTrainers} entrenadores de tu plan. Actualiza tu plan para agregar más.`,
    }
  }

  return {
    allowed: true,
    current: currentCount,
    limit: planLimits.maxTrainers,
  }
}

// =============================================================================
// CHECK ROLE LIMIT (Unified check for any role)
// =============================================================================

export async function checkRoleLimit(
  organizationId: string,
  targetRole: string
): Promise<LimitCheckResult> {
  // If assigning trainer/instructor role, check trainer limit
  if (TRAINER_ROLES.includes(targetRole as typeof TRAINER_ROLES[number])) {
    return checkTrainerLimit(organizationId)
  }

  // If assigning system user role, check user limit
  if (SYSTEM_USER_ROLES.includes(targetRole as typeof SYSTEM_USER_ROLES[number])) {
    return checkUserLimit(organizationId)
  }

  // Client role has no limit
  return { allowed: true, current: 0, limit: -1 }
}

// =============================================================================
// CHECK FEATURE ACCESS
// =============================================================================

export async function checkFeatureAccess(
  organizationId: string,
  feature: string
): Promise<{ allowed: boolean; message?: string }> {
  const limits = await getOrganizationLimits(organizationId)
  if (!limits) {
    return { allowed: false, message: 'Organización no encontrada' }
  }

  const planLimits = PLAN_LIMITS[limits.plan]

  // Check feature flags from plan
  const featureMap: Record<string, boolean> = {
    api_access: planLimits.apiAccess,
    advanced_reports: planLimits.advancedReports,
    custom_branding: planLimits.customBranding,
    white_label: planLimits.whiteLabel,
    export_data: planLimits.exportData,
    multi_location: planLimits.multiLocation,
    webhooks: planLimits.webhooks,
  }

  const allowed = featureMap[feature] ?? limits.features[feature] ?? false

  if (!allowed) {
    return {
      allowed: false,
      message: `La función "${feature}" no está disponible en tu plan. Actualiza a un plan superior.`,
    }
  }

  return { allowed: true }
}

// =============================================================================
// CHECK API ACCESS
// =============================================================================

export async function checkApiAccess(
  organizationId: string
): Promise<{ allowed: boolean; message?: string }> {
  const limits = await getOrganizationLimits(organizationId)
  if (!limits) {
    return { allowed: false, message: 'Organización no encontrada' }
  }

  const planLimits = PLAN_LIMITS[limits.plan]

  if (!planLimits.apiAccess) {
    return {
      allowed: false,
      message: 'El acceso a la API no está disponible en tu plan. Actualiza al plan Pro o superior.',
    }
  }

  return { allowed: true }
}

// =============================================================================
// FORMAT LIMIT MESSAGE
// =============================================================================

export function formatLimitMessage(
  resourceName: string,
  current: number,
  limit: number
): string {
  if (limit === -1) {
    return `${resourceName}: Ilimitado`
  }
  return `${resourceName}: ${current}/${limit}`
}

// =============================================================================
// WHATSAPP LIMITS
// =============================================================================

export async function checkWhatsAppLimit(
  organizationId: string
): Promise<LimitCheckResult> {
  const supabase = await createClient()

  const { data, error } = await callRpc(supabase,'get_whatsapp_remaining', {
    p_organization_id: organizationId,
  })

  if (error) {
    console.error('Error checking WhatsApp limit:', error)
    return { allowed: false, current: 0, limit: 0, message: 'Error al verificar límites' }
  }

  const result = data as { used: number; remaining: number; monthly_limit: number } | null

  if (!result) {
    return { allowed: true, current: 0, limit: 50 }
  }

  if (result.remaining <= 0) {
    return {
      allowed: false,
      current: result.used,
      limit: result.monthly_limit,
      message: `Has alcanzado el límite de ${result.monthly_limit} mensajes WhatsApp/mes de tu plan.`,
    }
  }

  return {
    allowed: true,
    current: result.used,
    limit: result.monthly_limit,
  }
}

export async function consumeWhatsAppMessage(
  organizationId: string,
  count: number = 1
): Promise<{ success: boolean; remaining: number }> {
  const supabase = await createClient()

  const { data, error } = await callRpc(supabase,'consume_whatsapp_message', {
    p_organization_id: organizationId,
    p_count: count,
  })

  if (error) {
    console.error('Error consuming WhatsApp message:', error)
    return { success: false, remaining: 0 }
  }

  const result = data as { success: boolean; remaining: number } | null
  return result || { success: false, remaining: 0 }
}

// =============================================================================
// EMAIL LIMITS
// =============================================================================

export async function checkEmailLimit(
  organizationId: string
): Promise<LimitCheckResult> {
  const supabase = await createClient()

  const { data, error } = await callRpc(supabase,'get_email_remaining', {
    p_organization_id: organizationId,
  })

  if (error) {
    console.error('Error checking email limit:', error)
    return { allowed: false, current: 0, limit: 0, message: 'Error al verificar límites' }
  }

  const result = data as { used: number; remaining: number; monthly_limit: number } | null

  if (!result) {
    return { allowed: true, current: 0, limit: 500 }
  }

  if (result.remaining <= 0) {
    return {
      allowed: false,
      current: result.used,
      limit: result.monthly_limit,
      message: `Has alcanzado el límite de ${result.monthly_limit} emails/mes de tu plan.`,
    }
  }

  return {
    allowed: true,
    current: result.used,
    limit: result.monthly_limit,
  }
}

export async function consumeEmail(
  organizationId: string,
  count: number = 1
): Promise<{ success: boolean; remaining: number }> {
  const supabase = await createClient()

  const { data, error } = await callRpc(supabase,'consume_email', {
    p_organization_id: organizationId,
    p_count: count,
  })

  if (error) {
    console.error('Error consuming email:', error)
    return { success: false, remaining: 0 }
  }

  const result = data as { success: boolean; remaining: number } | null
  return result || { success: false, remaining: 0 }
}

// =============================================================================
// STORAGE LIMITS
// =============================================================================

export async function checkStorageLimit(
  organizationId: string,
  additionalBytes: number = 0
): Promise<LimitCheckResult & { usedBytes: number; limitBytes: number }> {
  const supabase = await createClient()

  const { data, error } = await callRpc(supabase,'get_storage_remaining', {
    p_organization_id: organizationId,
  })

  if (error) {
    console.error('Error checking storage limit:', error)
    return {
      allowed: false,
      current: 0,
      limit: 0,
      usedBytes: 0,
      limitBytes: 0,
      message: 'Error al verificar límites de almacenamiento',
    }
  }

  const result = data as {
    used_bytes: number
    remaining_bytes: number
    limit_bytes: number
    used_percentage: number
  } | null

  if (!result) {
    return { allowed: true, current: 0, limit: 1, usedBytes: 0, limitBytes: 1073741824 }
  }

  const wouldExceed = (result.used_bytes + additionalBytes) > result.limit_bytes

  if (wouldExceed) {
    const limitGB = Math.round(result.limit_bytes / 1073741824)
    return {
      allowed: false,
      current: result.used_percentage,
      limit: 100,
      usedBytes: result.used_bytes,
      limitBytes: result.limit_bytes,
      message: `Has alcanzado el límite de ${limitGB} GB de almacenamiento de tu plan.`,
    }
  }

  return {
    allowed: true,
    current: result.used_percentage,
    limit: 100,
    usedBytes: result.used_bytes,
    limitBytes: result.limit_bytes,
  }
}

export async function updateStorageUsage(
  organizationId: string,
  bytesChange: number,
  fileType: 'image' | 'document' | 'other' = 'other'
): Promise<{ success: boolean; totalBytes: number }> {
  const supabase = await createClient()

  const { data, error } = await callRpc(supabase,'update_storage_usage', {
    p_organization_id: organizationId,
    p_bytes_change: bytesChange,
    p_file_type: fileType,
  })

  if (error) {
    console.error('Error updating storage usage:', error)
    return { success: false, totalBytes: 0 }
  }

  const result = data as { success: boolean; total_bytes: number } | null
  return {
    success: result?.success ?? false,
    totalBytes: result?.total_bytes ?? 0,
  }
}

// =============================================================================
// API RATE LIMITS
// =============================================================================

export async function checkApiRateLimit(
  organizationId: string
): Promise<{
  allowed: boolean
  used: number
  remaining: number
  dailyLimit: number
  message?: string
}> {
  const supabase = await createClient()

  const { data, error } = await callRpc(supabase,'check_api_rate_limit', {
    p_organization_id: organizationId,
  })

  if (error) {
    console.error('Error checking API rate limit:', error)
    return {
      allowed: false,
      used: 0,
      remaining: 0,
      dailyLimit: 0,
      message: 'Error al verificar límites de API',
    }
  }

  const result = data as {
    allowed: boolean
    used: number
    remaining: number
    daily_limit: number
  } | null

  if (!result) {
    return {
      allowed: false,
      used: 0,
      remaining: 0,
      dailyLimit: 0,
      message: 'El acceso a la API no está disponible en tu plan.',
    }
  }

  if (result.daily_limit === 0) {
    return {
      allowed: false,
      used: 0,
      remaining: 0,
      dailyLimit: 0,
      message: 'El acceso a la API no está disponible en tu plan. Actualiza al plan Pro.',
    }
  }

  if (!result.allowed) {
    return {
      allowed: false,
      used: result.used,
      remaining: 0,
      dailyLimit: result.daily_limit,
      message: `Has alcanzado el límite de ${result.daily_limit} requests/día de tu plan.`,
    }
  }

  return {
    allowed: true,
    used: result.used,
    remaining: result.remaining,
    dailyLimit: result.daily_limit,
  }
}

export async function consumeApiRequest(
  organizationId: string,
  isWrite: boolean = false
): Promise<{ success: boolean; remaining: number }> {
  const supabase = await createClient()

  const { data, error } = await callRpc(supabase,'consume_api_request', {
    p_organization_id: organizationId,
    p_is_write: isWrite,
  })

  if (error) {
    console.error('Error consuming API request:', error)
    return { success: false, remaining: 0 }
  }

  const result = data as { success: boolean; remaining: number } | null
  return result || { success: false, remaining: 0 }
}

// =============================================================================
// AI LIMITS
// =============================================================================

export async function checkAILimit(
  organizationId: string
): Promise<LimitCheckResult & { resetDate?: string }> {
  const supabase = await createClient()

  const limits = await getOrganizationLimits(organizationId)
  if (!limits) {
    return { allowed: false, current: 0, limit: 0, message: 'Organización no encontrada' }
  }

  const planLimits = PLAN_LIMITS[limits.plan]

  // Unlimited check
  if (planLimits.aiRequestsPerMonth === -1) {
    return { allowed: true, current: 0, limit: -1 }
  }

  // Get current month usage from organization_ai_usage table
  const now = new Date()

  // Use RPC or direct query - try to get usage from the table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('organization_ai_usage')
    .select('requests_this_period')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error checking AI limit:', error)
    // If table doesn't exist or query fails, allow by default
    return { allowed: true, current: 0, limit: planLimits.aiRequestsPerMonth }
  }

  const currentUsage = (data as { requests_this_period?: number } | null)?.requests_this_period || 0

  // Calculate reset date (first of next month)
  const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const resetDateStr = resetDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })

  if (currentUsage >= planLimits.aiRequestsPerMonth) {
    return {
      allowed: false,
      current: currentUsage,
      limit: planLimits.aiRequestsPerMonth,
      message: `Has alcanzado el límite de ${planLimits.aiRequestsPerMonth} consultas AI/mes de tu plan. Se reinicia el ${resetDateStr}.`,
      resetDate: resetDateStr,
    }
  }

  return {
    allowed: true,
    current: currentUsage,
    limit: planLimits.aiRequestsPerMonth,
    resetDate: resetDateStr,
  }
}

export async function consumeAIRequest(
  organizationId: string,
  tokensUsed: number = 0
): Promise<{ success: boolean; remaining: number }> {
  const supabase = await createClient()

  const limits = await getOrganizationLimits(organizationId)
  if (!limits) {
    return { success: false, remaining: 0 }
  }

  const planLimits = PLAN_LIMITS[limits.plan]

  // Use RPC if available, otherwise just return success
  // The actual tracking is done via the consume_ai_tokens RPC in the API
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('consume_ai_tokens', {
      org_id: organizationId,
      tokens_to_consume: tokensUsed,
    })

    if (error) {
      console.error('Error consuming AI tokens:', error)
      return { success: true, remaining: planLimits.aiRequestsPerMonth } // Allow on error
    }

    const result = data as { success?: boolean; remaining?: number } | null
    return {
      success: result?.success ?? true,
      remaining: result?.remaining ?? planLimits.aiRequestsPerMonth,
    }
  } catch {
    // RPC might not exist, just return success
    return { success: true, remaining: planLimits.aiRequestsPerMonth }
  }
}

// =============================================================================
// LOCATION LIMITS
// =============================================================================

export async function checkLocationLimit(
  organizationId: string
): Promise<LimitCheckResult> {
  const supabase = await createClient()

  const limits = await getOrganizationLimits(organizationId)
  if (!limits) {
    return { allowed: false, current: 0, limit: 0, message: 'Organización no encontrada' }
  }

  // Unlimited check
  if (limits.maxLocations === -1 || limits.maxLocations >= 999) {
    return { allowed: true, current: 0, limit: -1 }
  }

  // Count current locations (table might not exist yet)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count, error } = await (supabase as any)
    .from('locations')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  if (error) {
    // Table might not exist yet - allow by default
    console.error('Error counting locations:', error)
    return { allowed: true, current: 0, limit: limits.maxLocations }
  }

  const currentCount = count || 0

  if (currentCount >= limits.maxLocations) {
    return {
      allowed: false,
      current: currentCount,
      limit: limits.maxLocations,
      message: `Has alcanzado el límite de ${limits.maxLocations} ubicaciones de tu plan. Actualiza tu plan para agregar más.`,
    }
  }

  return {
    allowed: true,
    current: currentCount,
    limit: limits.maxLocations,
  }
}

// =============================================================================
// CLASS LIMITS
// =============================================================================

export async function checkClassLimit(
  organizationId: string
): Promise<LimitCheckResult> {
  const supabase = await createClient()

  const limits = await getOrganizationLimits(organizationId)
  if (!limits) {
    return { allowed: false, current: 0, limit: 0, message: 'Organización no encontrada' }
  }

  const planLimits = PLAN_LIMITS[limits.plan]

  // Unlimited check (most plans have unlimited classes)
  if (planLimits.maxClasses === -1) {
    return { allowed: true, current: 0, limit: -1 }
  }

  // Count current classes
  const { count, error } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  if (error) {
    console.error('Error counting classes:', error)
    return { allowed: false, current: 0, limit: planLimits.maxClasses, message: 'Error al verificar límites' }
  }

  const currentCount = count || 0

  if (currentCount >= planLimits.maxClasses) {
    return {
      allowed: false,
      current: currentCount,
      limit: planLimits.maxClasses,
      message: `Has alcanzado el límite de ${planLimits.maxClasses} clases de tu plan. Actualiza tu plan para agregar más.`,
    }
  }

  return {
    allowed: true,
    current: currentCount,
    limit: planLimits.maxClasses,
  }
}

// =============================================================================
// FILE SIZE LIMIT
// =============================================================================

export async function checkFileSizeLimit(
  organizationId: string,
  fileSizeBytes: number
): Promise<{ allowed: boolean; maxSizeMB: number; message?: string }> {
  const limits = await getOrganizationLimits(organizationId)
  if (!limits) {
    return { allowed: false, maxSizeMB: 0, message: 'Organización no encontrada' }
  }

  const planLimits = PLAN_LIMITS[limits.plan]
  const maxSizeBytes = planLimits.maxFileUploadMB * 1024 * 1024

  if (fileSizeBytes > maxSizeBytes) {
    return {
      allowed: false,
      maxSizeMB: planLimits.maxFileUploadMB,
      message: `El archivo excede el límite de ${planLimits.maxFileUploadMB} MB de tu plan.`,
    }
  }

  return {
    allowed: true,
    maxSizeMB: planLimits.maxFileUploadMB,
  }
}
