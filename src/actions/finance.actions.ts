'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  paymentSchema,
  expenseSchema,
  incomeSchema,
  type PaymentFormData,
  type ExpenseFormData,
  type IncomeFormData,
} from '@/schemas/finance.schema'
import {
  requirePermission,
  requireAnyPermission,
  type ActionResult,
  successResult,
  errorResult,
  forbiddenResult,
  unauthorizedResult,
} from '@/lib/auth/server-auth'
import { hasPermission } from '@/lib/rbac'

// =============================================================================
// TYPES
// =============================================================================

export interface Payment {
  id: string
  organization_id: string
  location_id: string | null
  member_id: string
  plan_id: string | null
  amount: number
  currency: string
  payment_method: string
  payment_date: string
  status: string
  notes: string | null
  reference_number: string | null
  created_by: string
  created_at: string
  // Joined fields
  member?: {
    id: string
    full_name: string
    email: string
  }
  plan?: {
    id: string
    name: string
  }
  created_by_profile?: {
    full_name: string
  }
  location?: {
    id: string
    name: string
  }
}

export interface Expense {
  id: string
  organization_id: string
  location_id: string | null
  description: string
  amount: number
  currency: string
  category: string
  expense_date: string
  vendor: string | null
  receipt_url: string | null
  notes: string | null
  is_recurring: boolean
  created_by: string
  created_at: string
  created_by_profile?: {
    full_name: string
  }
  location?: {
    id: string
    name: string
  }
}

export interface Income {
  id: string
  organization_id: string
  location_id: string | null
  description: string
  amount: number
  currency: string
  category: string
  income_date: string
  notes: string | null
  created_by: string
  created_at: string
  created_by_profile?: {
    full_name: string
  }
  location?: {
    id: string
    name: string
  }
}

export interface FinanceOverview {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  membershipIncome: number
  otherIncome: number
  pendingPayments: number
  currency: string
  period: {
    from: string
    to: string
  }
  // Comparison data (optional, only when compare=true)
  comparison?: {
    totalIncome: number
    totalExpenses: number
    netProfit: number
    membershipIncome: number
    otherIncome: number
    // Percentage changes
    totalIncomeChange: number
    totalExpensesChange: number
    netProfitChange: number
    period: {
      from: string
      to: string
    }
  }
}

export interface MemberPaymentStatus {
  status: 'active' | 'pending' | 'overdue' | 'inactive'
  lastPaymentDate: string | null
  nextDueDate: string | null
  // Only included for users with view_gym_finances permission
  lastPaymentAmount?: number
  totalPaid?: number
}

// =============================================================================
// FINANCE OVERVIEW (Admin only)
// =============================================================================

export async function getFinanceOverview(params?: {
  startDate?: string
  endDate?: string
  compare?: boolean
  compareStartDate?: string
  compareEndDate?: string
  location_id?: string
  include_org_wide?: boolean // Include org-wide expenses/income when filtering by location
}): Promise<{ data: FinanceOverview | null; error: string | null }> {
  const { authorized, user, error } = await requirePermission('view_gym_finances')

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  // Get date range (default to current month)
  const now = new Date()
  const startDate = params?.startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endDate = params?.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

  // Get organization currency
  const { data: org } = await supabase
    .from('organizations')
    .select('currency')
    .eq('id', user.organizationId)
    .single()

  const currency = (org as { currency: string } | null)?.currency || 'MXN'
  const organizationId = user.organizationId
  const locationId = params?.location_id
  const includeOrgWide = params?.include_org_wide ?? true

  // Helper function to fetch period data
  async function fetchPeriodData(periodStart: string, periodEnd: string) {
    // Get total payments (membership income)
    let paymentsQuery = supabase
      .from('payments')
      .select('amount, status')
      .eq('organization_id', organizationId)
      .eq('status', 'paid')
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd)

    if (locationId) {
      paymentsQuery = paymentsQuery.eq('location_id', locationId)
    }

    const { data: payments } = await paymentsQuery

    const membershipIncome = (payments as { amount: number }[] || [])
      .reduce((sum, p) => sum + Number(p.amount), 0)

    // Get other income
    let incomeQuery = supabase
      .from('income')
      .select('amount')
      .eq('organization_id', organizationId)
      .gte('income_date', periodStart)
      .lte('income_date', periodEnd)

    if (locationId) {
      if (includeOrgWide) {
        incomeQuery = incomeQuery.or(`location_id.eq.${locationId},location_id.is.null`)
      } else {
        incomeQuery = incomeQuery.eq('location_id', locationId)
      }
    }

    const { data: incomeData } = await incomeQuery

    const otherIncome = (incomeData as { amount: number }[] || [])
      .reduce((sum, i) => sum + Number(i.amount), 0)

    // Get total expenses
    let expensesQuery = supabase
      .from('expenses')
      .select('amount')
      .eq('organization_id', organizationId)
      .gte('expense_date', periodStart)
      .lte('expense_date', periodEnd)

    if (locationId) {
      if (includeOrgWide) {
        expensesQuery = expensesQuery.or(`location_id.eq.${locationId},location_id.is.null`)
      } else {
        expensesQuery = expensesQuery.eq('location_id', locationId)
      }
    }

    const { data: expensesData } = await expensesQuery

    const totalExpenses = (expensesData as { amount: number }[] || [])
      .reduce((sum, e) => sum + Number(e.amount), 0)

    const totalIncome = membershipIncome + otherIncome
    const netProfit = totalIncome - totalExpenses

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      membershipIncome,
      otherIncome,
    }
  }

  // Fetch current period data
  const currentPeriod = await fetchPeriodData(startDate, endDate)

  // Get pending payments (always current, not filtered by date)
  let pendingQuery = supabase
    .from('payments')
    .select('amount')
    .eq('organization_id', organizationId)
    .eq('status', 'pending')

  if (locationId) {
    pendingQuery = pendingQuery.eq('location_id', locationId)
  }

  const { data: pendingPaymentsData } = await pendingQuery

  const pendingPayments = (pendingPaymentsData as { amount: number }[] || [])
    .reduce((sum, p) => sum + Number(p.amount), 0)

  // Build result
  const result: FinanceOverview = {
    ...currentPeriod,
    pendingPayments,
    currency,
    period: {
      from: startDate,
      to: endDate,
    },
  }

  // Fetch comparison data if requested
  if (params?.compare && params?.compareStartDate && params?.compareEndDate) {
    const prevPeriod = await fetchPeriodData(params.compareStartDate, params.compareEndDate)

    // Calculate percentage changes
    const calcChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100 * 100) / 100
    }

    result.comparison = {
      ...prevPeriod,
      totalIncomeChange: calcChange(currentPeriod.totalIncome, prevPeriod.totalIncome),
      totalExpensesChange: calcChange(currentPeriod.totalExpenses, prevPeriod.totalExpenses),
      netProfitChange: calcChange(currentPeriod.netProfit, prevPeriod.netProfit),
      period: {
        from: params.compareStartDate,
        to: params.compareEndDate,
      },
    }
  }

  return {
    data: result,
    error: null,
  }
}

// =============================================================================
// PAYMENTS
// =============================================================================

export async function getPayments(params?: {
  query?: string
  status?: string
  startDate?: string
  endDate?: string
  location_id?: string
  page?: number
  per_page?: number
}): Promise<{ data: Payment[] | null; count: number; error: string | null }> {
  const { authorized, user, error } = await requireAnyPermission([
    'view_gym_finances',
    'create_payments',
  ])

  if (!authorized || !user) {
    return { data: null, count: 0, error: error || 'No autorizado' }
  }

  const page = params?.page ?? 1
  const perPage = params?.per_page ?? 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const supabase = await createClient()

  let query = supabase
    .from('payments')
    .select(`
      *,
      member:members(id, full_name, email),
      plan:membership_plans(id, name),
      created_by_profile:profiles(full_name)
    `, { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params?.status) {
    query = query.eq('status', params.status as 'pending' | 'paid' | 'failed' | 'refunded')
  }

  if (params?.startDate) {
    query = query.gte('created_at', params.startDate)
  }

  if (params?.endDate) {
    query = query.lte('created_at', params.endDate)
  }

  // Filter by location if specified
  if (params?.location_id) {
    query = query.eq('location_id', params.location_id)
  }

  const { data, count, error: dbError } = await query

  if (dbError) {
    return { data: null, count: 0, error: dbError.message }
  }

  return { data: data as Payment[], count: count ?? 0, error: null }
}

export async function createPayment(data: PaymentFormData): Promise<ActionResult> {
  const { authorized, user, error } = await requirePermission('create_payments')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const validated = paymentSchema.safeParse(data)

  if (!validated.success) {
    return errorResult('Datos invalidos', validated.error.flatten().fieldErrors)
  }

  const supabase = await createClient()

  // Get organization currency
  const { data: org } = await supabase
    .from('organizations')
    .select('currency')
    .eq('id', user!.organizationId)
    .single()

  const currency = (org as { currency: string } | null)?.currency || 'MXN'

  const insertData = {
    ...validated.data,
    organization_id: user!.organizationId,
    currency,
    status: 'paid',
    created_by: user!.id,
  }

  const { data: payment, error: dbError } = await supabase
    .from('payments')
    .insert(insertData as never)
    .select()
    .single()

  if (dbError) {
    return errorResult(dbError.message)
  }

  // Update member's membership status if plan is included
  if (validated.data.plan_id && validated.data.member_id) {
    await supabase
      .from('members')
      .update({
        current_plan_id: validated.data.plan_id,
        membership_status: 'active',
      } as never)
      .eq('id', validated.data.member_id)
      .eq('organization_id', user!.organizationId)
  }

  revalidatePath('/dashboard/finances')
  revalidatePath('/dashboard/finances/payments')
  return successResult('Pago registrado exitosamente', payment)
}

// =============================================================================
// EXPENSES
// =============================================================================

export async function getExpenses(params?: {
  query?: string
  category?: string
  startDate?: string
  endDate?: string
  location_id?: string
  include_org_wide?: boolean // Include expenses with no location (org-wide)
  page?: number
  per_page?: number
}): Promise<{ data: Expense[] | null; count: number; error: string | null }> {
  const { authorized, user, error } = await requireAnyPermission([
    'view_gym_finances',
    'create_expenses',
  ])

  if (!authorized || !user) {
    return { data: null, count: 0, error: error || 'No autorizado' }
  }

  const page = params?.page ?? 1
  const perPage = params?.per_page ?? 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const supabase = await createClient()

  let dbQuery = supabase
    .from('expenses')
    .select(`
      *,
      created_by_profile:profiles(full_name)
    `, { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params?.query) {
    dbQuery = dbQuery.ilike('description', `%${params.query}%`)
  }

  if (params?.category) {
    dbQuery = dbQuery.eq('category', params.category as 'rent' | 'utilities' | 'salaries' | 'equipment' | 'maintenance' | 'marketing' | 'supplies' | 'insurance' | 'taxes' | 'other')
  }

  if (params?.startDate) {
    dbQuery = dbQuery.gte('created_at', params.startDate)
  }

  if (params?.endDate) {
    dbQuery = dbQuery.lte('created_at', params.endDate)
  }

  // Filter by location if specified
  if (params?.location_id) {
    if (params?.include_org_wide) {
      // Include both location-specific AND org-wide expenses
      dbQuery = dbQuery.or(`location_id.eq.${params.location_id},location_id.is.null`)
    } else {
      dbQuery = dbQuery.eq('location_id', params.location_id)
    }
  }

  const { data, count, error: dbError } = await dbQuery

  if (dbError) {
    return { data: null, count: 0, error: dbError.message }
  }

  return { data: data as Expense[], count: count ?? 0, error: null }
}

export async function createExpense(data: ExpenseFormData): Promise<ActionResult> {
  const { authorized, user, error } = await requirePermission('create_expenses')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const validated = expenseSchema.safeParse(data)

  if (!validated.success) {
    return errorResult('Datos invalidos', validated.error.flatten().fieldErrors)
  }

  const supabase = await createClient()

  // Get organization currency
  const { data: org } = await supabase
    .from('organizations')
    .select('currency')
    .eq('id', user!.organizationId)
    .single()

  const currency = (org as { currency: string } | null)?.currency || 'MXN'

  const insertData = {
    ...validated.data,
    organization_id: user!.organizationId,
    currency,
    created_by: user!.id,
  }

  const { data: expense, error: dbError } = await supabase
    .from('expenses')
    .insert(insertData as never)
    .select()
    .single()

  if (dbError) {
    return errorResult(dbError.message)
  }

  revalidatePath('/dashboard/finances')
  revalidatePath('/dashboard/finances/expenses')
  return successResult('Gasto registrado exitosamente', expense)
}

// =============================================================================
// INCOME (Other income, not memberships)
// =============================================================================

export async function getIncome(params?: {
  query?: string
  category?: string
  startDate?: string
  endDate?: string
  location_id?: string
  include_org_wide?: boolean // Include income with no location (org-wide)
  page?: number
  per_page?: number
}): Promise<{ data: Income[] | null; count: number; error: string | null }> {
  const { authorized, user, error } = await requireAnyPermission([
    'view_gym_finances',
    'create_payments',
  ])

  if (!authorized || !user) {
    return { data: null, count: 0, error: error || 'No autorizado' }
  }

  const page = params?.page ?? 1
  const perPage = params?.per_page ?? 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const supabase = await createClient()

  let dbQuery = supabase
    .from('income')
    .select(`
      *,
      created_by_profile:profiles(full_name)
    `, { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params?.query) {
    dbQuery = dbQuery.ilike('description', `%${params.query}%`)
  }

  if (params?.category) {
    dbQuery = dbQuery.eq('category', params.category as 'product_sale' | 'service' | 'rental' | 'event' | 'donation' | 'other')
  }

  if (params?.startDate) {
    dbQuery = dbQuery.gte('created_at', params.startDate)
  }

  if (params?.endDate) {
    dbQuery = dbQuery.lte('created_at', params.endDate)
  }

  // Filter by location if specified
  if (params?.location_id) {
    if (params?.include_org_wide) {
      // Include both location-specific AND org-wide income
      dbQuery = dbQuery.or(`location_id.eq.${params.location_id},location_id.is.null`)
    } else {
      dbQuery = dbQuery.eq('location_id', params.location_id)
    }
  }

  const { data, count, error: dbError } = await dbQuery

  if (dbError) {
    return { data: null, count: 0, error: dbError.message }
  }

  return { data: data as Income[], count: count ?? 0, error: null }
}

export async function createIncome(data: IncomeFormData): Promise<ActionResult> {
  const { authorized, user, error } = await requirePermission('create_payments')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const validated = incomeSchema.safeParse(data)

  if (!validated.success) {
    return errorResult('Datos invalidos', validated.error.flatten().fieldErrors)
  }

  const supabase = await createClient()

  // Get organization currency
  const { data: org } = await supabase
    .from('organizations')
    .select('currency')
    .eq('id', user!.organizationId)
    .single()

  const currency = (org as { currency: string } | null)?.currency || 'MXN'

  const insertData = {
    ...validated.data,
    organization_id: user!.organizationId,
    currency,
    created_by: user!.id,
  }

  const { data: income, error: dbError } = await supabase
    .from('income')
    .insert(insertData as never)
    .select()
    .single()

  if (dbError) {
    return errorResult(dbError.message)
  }

  revalidatePath('/dashboard/finances')
  revalidatePath('/dashboard/finances/income')
  return successResult('Ingreso registrado exitosamente', income)
}

// =============================================================================
// MEMBER PAYMENT STATUS (Available to Admin, Assistant, Trainer)
// =============================================================================

export async function getMemberPaymentStatus(
  memberId: string
): Promise<{ data: MemberPaymentStatus | null; error: string | null }> {
  const { authorized, user, error } = await requirePermission('view_member_payment_status')

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()

  // Get member info
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('membership_status, membership_end_date, current_plan_id')
    .eq('id', memberId)
    .eq('organization_id', user.organizationId)
    .single()

  if (memberError || !member) {
    return { data: null, error: 'Miembro no encontrado' }
  }

  const memberData = member as {
    membership_status: string
    membership_end_date: string | null
    current_plan_id: string | null
  }

  // Get last payment
  const { data: lastPayment } = await supabase
    .from('payments')
    .select('payment_date, amount')
    .eq('member_id', memberId)
    .eq('organization_id', user.organizationId)
    .eq('status', 'paid')
    .order('payment_date', { ascending: false })
    .limit(1)
    .single()

  const lastPaymentData = lastPayment as { payment_date: string; amount: number } | null

  // Determine status
  let status: MemberPaymentStatus['status'] = 'inactive'
  const now = new Date()
  const endDate = memberData.membership_end_date ? new Date(memberData.membership_end_date) : null

  if (memberData.membership_status === 'active' && endDate && endDate > now) {
    status = 'active'
  } else if (endDate && endDate < now) {
    status = 'overdue'
  } else if (memberData.membership_status === 'pending') {
    status = 'pending'
  }

  const result: MemberPaymentStatus = {
    status,
    lastPaymentDate: lastPaymentData?.payment_date || null,
    nextDueDate: memberData.membership_end_date,
  }

  // Only include amounts if user has view_gym_finances permission
  if (hasPermission({ id: user.id, role: user.role, organization_id: user.organizationId }, 'view_gym_finances')) {
    // Get total paid
    const { data: totalPaidData } = await supabase
      .from('payments')
      .select('amount')
      .eq('member_id', memberId)
      .eq('organization_id', user.organizationId)
      .eq('status', 'paid')

    const totalPaid = (totalPaidData as { amount: number }[] || [])
      .reduce((sum, p) => sum + p.amount, 0)

    result.lastPaymentAmount = lastPaymentData?.amount
    result.totalPaid = totalPaid
  }

  return { data: result, error: null }
}

// =============================================================================
// DELETE OPERATIONS (Admin only)
// =============================================================================

export async function deletePayment(id: string): Promise<ActionResult> {
  const { authorized, user, error } = await requirePermission('manage_gym_finances')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const supabase = await createClient()

  const { error: dbError } = await supabase
    .from('payments')
    .delete()
    .eq('id', id)
    .eq('organization_id', user!.organizationId)

  if (dbError) {
    return errorResult(dbError.message)
  }

  revalidatePath('/dashboard/finances/payments')
  return successResult('Pago eliminado')
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const { authorized, user, error } = await requirePermission('manage_gym_finances')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const supabase = await createClient()

  const { error: dbError } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
    .eq('organization_id', user!.organizationId)

  if (dbError) {
    return errorResult(dbError.message)
  }

  revalidatePath('/dashboard/finances/expenses')
  return successResult('Gasto eliminado')
}

export async function deleteIncome(id: string): Promise<ActionResult> {
  const { authorized, user, error } = await requirePermission('manage_gym_finances')

  if (!authorized) {
    return user ? forbiddenResult() : unauthorizedResult(error || undefined)
  }

  const supabase = await createClient()

  const { error: dbError } = await supabase
    .from('income')
    .delete()
    .eq('id', id)
    .eq('organization_id', user!.organizationId)

  if (dbError) {
    return errorResult(dbError.message)
  }

  revalidatePath('/dashboard/finances/income')
  return successResult('Ingreso eliminado')
}

// =============================================================================
// DASHBOARD KPIs (Admin only)
// =============================================================================

export interface RevenueKpiResponse {
  totalRevenue: number
  currency: string
  period: {
    from: string
    to: string
  }
  previousPeriodRevenue: number
  changePct: number
}

/**
 * Get Total Revenue KPI for dashboard
 * Protected with view_gym_finances permission (admin only)
 */
export async function getRevenueKpi(params?: {
  range?: 'today' | 'week' | 'month' | 'year'
  location_id?: string
  include_org_wide?: boolean
}): Promise<{ data: RevenueKpiResponse | null; error: string | null }> {
  const { authorized, user, error } = await requirePermission('view_gym_finances')

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()
  const now = new Date()
  const range = params?.range || 'month'
  const locationId = params?.location_id
  const includeOrgWide = params?.include_org_wide ?? true

  // Calculate date ranges based on selected range
  let startDate: Date
  let endDate: Date
  let prevStartDate: Date
  let prevEndDate: Date

  switch (range) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      prevStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
      prevEndDate = startDate
      break
    case 'week':
      const dayOfWeek = now.getDay()
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      prevStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      prevEndDate = startDate
      break
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1)
      endDate = new Date(now.getFullYear() + 1, 0, 1)
      prevStartDate = new Date(now.getFullYear() - 1, 0, 1)
      prevEndDate = startDate
      break
    case 'month':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      prevEndDate = startDate
      break
  }

  // Get organization currency
  const { data: org } = await supabase
    .from('organizations')
    .select('currency')
    .eq('id', user.organizationId)
    .single()

  const currency = (org as { currency: string } | null)?.currency || 'MXN'

  // Get current period payments (membership income)
  let currentPaymentsQuery = supabase
    .from('payments')
    .select('amount')
    .eq('organization_id', user.organizationId)
    .eq('status', 'paid')
    .gte('created_at', startDate.toISOString())
    .lt('created_at', endDate.toISOString())

  if (locationId) {
    currentPaymentsQuery = currentPaymentsQuery.eq('location_id', locationId)
  }

  const { data: currentPayments } = await currentPaymentsQuery

  const membershipIncome = (currentPayments as { amount: number }[] || [])
    .reduce((sum, p) => sum + Number(p.amount), 0)

  // Get current period other income
  let currentIncomeQuery = supabase
    .from('income')
    .select('amount')
    .eq('organization_id', user.organizationId)
    .gte('income_date', startDate.toISOString())
    .lt('income_date', endDate.toISOString())

  if (locationId) {
    if (includeOrgWide) {
      currentIncomeQuery = currentIncomeQuery.or(`location_id.eq.${locationId},location_id.is.null`)
    } else {
      currentIncomeQuery = currentIncomeQuery.eq('location_id', locationId)
    }
  }

  const { data: currentIncome } = await currentIncomeQuery

  const otherIncome = (currentIncome as { amount: number }[] || [])
    .reduce((sum, i) => sum + Number(i.amount), 0)

  const totalRevenue = membershipIncome + otherIncome

  // Get previous period payments
  let prevPaymentsQuery = supabase
    .from('payments')
    .select('amount')
    .eq('organization_id', user.organizationId)
    .eq('status', 'paid')
    .gte('created_at', prevStartDate.toISOString())
    .lt('created_at', prevEndDate.toISOString())

  if (locationId) {
    prevPaymentsQuery = prevPaymentsQuery.eq('location_id', locationId)
  }

  const { data: prevPayments } = await prevPaymentsQuery

  const prevMembershipIncome = (prevPayments as { amount: number }[] || [])
    .reduce((sum, p) => sum + Number(p.amount), 0)

  // Get previous period other income
  let prevIncomeQuery = supabase
    .from('income')
    .select('amount')
    .eq('organization_id', user.organizationId)
    .gte('income_date', prevStartDate.toISOString())
    .lt('income_date', prevEndDate.toISOString())

  if (locationId) {
    if (includeOrgWide) {
      prevIncomeQuery = prevIncomeQuery.or(`location_id.eq.${locationId},location_id.is.null`)
    } else {
      prevIncomeQuery = prevIncomeQuery.eq('location_id', locationId)
    }
  }

  const { data: prevIncome } = await prevIncomeQuery

  const prevOtherIncome = (prevIncome as { amount: number }[] || [])
    .reduce((sum, i) => sum + Number(i.amount), 0)

  const previousPeriodRevenue = prevMembershipIncome + prevOtherIncome

  // Calculate change percentage
  const changePct = previousPeriodRevenue > 0
    ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
    : totalRevenue > 0 ? 100 : 0

  return {
    data: {
      totalRevenue,
      currency,
      period: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      previousPeriodRevenue,
      changePct: Math.round(changePct * 100) / 100,
    },
    error: null,
  }
}
