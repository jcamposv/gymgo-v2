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
// CHECK USER LIMIT (Admin users)
// =============================================================================

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

  // Count current admin users (excluding members role)
  // Valid roles are: owner, admin, instructor, trainer, assistant, nutritionist
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .in('role', ['owner', 'admin', 'instructor', 'trainer', 'assistant', 'nutritionist'])

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
      message: `Has alcanzado el límite de ${limits.maxUsers} usuarios de tu plan. Actualiza tu plan para agregar más.`,
    }
  }

  return {
    allowed: true,
    current: currentCount,
    limit: limits.maxUsers,
  }
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
