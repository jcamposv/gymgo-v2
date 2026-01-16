'use server'

import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/server-auth'

interface ReportSummary {
  period: string
  totalMembers: number
  activeMembers: number
  newMembers: number
  totalCheckIns: number
  totalClasses: number
  totalRevenue: number
  avgCheckInsPerDay: number
  popularClassTypes: { type: string; count: number }[]
  membersByStatus: { status: string; count: number }[]
  revenueByMonth: { month: string; revenue: number }[]
}


// =============================================================================
// GET REPORT SUMMARY
// =============================================================================

export async function getReportSummary(period: 'week' | 'month' | 'year' = 'month'): Promise<{
  data: ReportSummary | null
  error: string | null
}> {
  const { authorized, user, error: authError } = await requirePermission('view_reports')

  if (!authorized || !user) {
    return { data: null, error: authError ?? 'No tienes permisos para ver reportes' }
  }

  const organizationId = user.organizationId
  if (!organizationId) {
    return { data: null, error: 'No se encontro la organizacion' }
  }

  const supabase = await createClient()
  const now = new Date()

  // Calculate period dates
  let periodStart: Date
  let periodLabel: string

  switch (period) {
    case 'week':
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
      periodLabel = 'Ultima semana'
      break
    case 'year':
      periodStart = new Date(now.getFullYear(), 0, 1)
      periodLabel = 'Este ano'
      break
    case 'month':
    default:
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      periodLabel = 'Este mes'
      break
  }

  const periodStartIso = periodStart.toISOString()
  const nowIso = now.toISOString()

  // Total members
  const { count: totalMembers } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  // Active members
  const { count: activeMembers } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  // New members in period
  const { count: newMembers } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', periodStartIso)

  // Total check-ins in period
  const { count: totalCheckIns } = await supabase
    .from('check_ins')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('checked_in_at', periodStartIso)

  // Total classes in period
  const { count: totalClasses } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('start_time', periodStartIso)
    .eq('is_cancelled', false)

  // Total revenue in period (payments + other income)
  const { data: paymentsData } = await supabase
    .from('payments')
    .select('amount')
    .eq('organization_id', organizationId)
    .eq('status', 'paid')
    .gte('payment_date', periodStartIso)

  const { data: incomeData } = await supabase
    .from('income')
    .select('amount')
    .eq('organization_id', organizationId)
    .gte('income_date', periodStartIso)

  const payments = paymentsData as { amount: number }[] | null
  const income = incomeData as { amount: number }[] | null
  const paymentsTotal = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0)
  const incomeTotal = (income || []).reduce((sum, i) => sum + Number(i.amount), 0)
  const totalRevenue = paymentsTotal + incomeTotal

  // Calculate days in period
  const daysInPeriod = Math.ceil((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
  const avgCheckInsPerDay = daysInPeriod > 0 ? Math.round((totalCheckIns || 0) / daysInPeriod) : 0

  // Members by status
  const membersByStatus: { status: string; count: number }[] = []
  const statuses = ['active', 'inactive', 'suspended', 'cancelled'] as const

  for (const status of statuses) {
    const { count } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', status)

    membersByStatus.push({ status, count: count || 0 })
  }

  // Popular class types
  const { data: classTypesData } = await supabase
    .from('classes')
    .select('class_type')
    .eq('organization_id', organizationId)
    .gte('start_time', periodStartIso)
    .eq('is_cancelled', false)
    .not('class_type', 'is', null)

  const classTypes = classTypesData as { class_type: string }[] | null
  const classTypeCount: Record<string, number> = {}

  for (const c of classTypes || []) {
    if (c.class_type) {
      classTypeCount[c.class_type] = (classTypeCount[c.class_type] || 0) + 1
    }
  }

  const popularClassTypes = Object.entries(classTypeCount)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Revenue by month (last 6 months) - includes payments + income
  const revenueByMonth: { month: string; revenue: number }[] = []

  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

    // Get payments for the month
    const { data: monthPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('organization_id', organizationId)
      .eq('status', 'paid')
      .gte('payment_date', monthStart.toISOString())
      .lte('payment_date', monthEnd.toISOString())

    // Get other income for the month
    const { data: monthIncome } = await supabase
      .from('income')
      .select('amount')
      .eq('organization_id', organizationId)
      .gte('income_date', monthStart.toISOString())
      .lte('income_date', monthEnd.toISOString())

    const monthPaymentsTyped = monthPayments as { amount: number }[] | null
    const monthIncomeTyped = monthIncome as { amount: number }[] | null
    const monthPaymentsTotal = (monthPaymentsTyped || []).reduce((sum, p) => sum + Number(p.amount), 0)
    const monthIncomeTotal = (monthIncomeTyped || []).reduce((sum, i) => sum + Number(i.amount), 0)
    const monthRevenue = monthPaymentsTotal + monthIncomeTotal

    const monthName = monthStart.toLocaleDateString('es-MX', { month: 'short' })
    revenueByMonth.push({ month: monthName, revenue: monthRevenue })
  }

  return {
    data: {
      period: periodLabel,
      totalMembers: totalMembers || 0,
      activeMembers: activeMembers || 0,
      newMembers: newMembers || 0,
      totalCheckIns: totalCheckIns || 0,
      totalClasses: totalClasses || 0,
      totalRevenue,
      avgCheckInsPerDay,
      popularClassTypes,
      membersByStatus,
      revenueByMonth,
    },
    error: null,
  }
}
