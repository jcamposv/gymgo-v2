'use server'

import { createClient } from '@/lib/supabase/server'
import { requirePermission, requireAnyPermission } from '@/lib/auth/server-auth'
import type {
  RevenuePoint,
  ActivityOverview,
  TrainerSchedule,
  ClientClass,
  RecentActivity,
  CalendarEvent,
} from '@/types/dashboard.types'

interface DashboardMetrics {
  totalMembers: number
  activeMembers: number
  totalClasses: number
  todayClasses: number
  todayCheckIns: number
  monthlyRevenue: number
  membersTrend: number
  checkInsTrend: number
}

interface RecentMember {
  id: string
  full_name: string
  email: string
  status: string
  created_at: string
}

interface UpcomingClass {
  id: string
  name: string
  class_type: string | null
  start_time: string
  current_bookings: number
  max_capacity: number
  instructor_name: string | null
}

export async function getDashboardMetrics(): Promise<{
  data: DashboardMetrics | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  const profile = profileData as { organization_id: string | null } | null

  if (!profile?.organization_id) {
    return { data: null, error: 'No organization found' }
  }

  const orgId = profile.organization_id
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()

  // Total members
  const { count: totalMembers } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  // Active members
  const { count: activeMembers } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'active')

  // Total classes
  const { count: totalClasses } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('start_time', todayStart)

  // Today's classes
  const { count: todayClasses } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('start_time', todayStart)
    .lt('start_time', todayEnd)

  // Today's check-ins
  const { count: todayCheckIns } = await supabase
    .from('check_ins')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('checked_in_at', todayStart)
    .lt('checked_in_at', todayEnd)

  // This month's revenue
  const { data: paymentsData } = await supabase
    .from('payments')
    .select('amount')
    .eq('organization_id', orgId)
    .eq('status', 'paid')
    .gte('paid_at', monthStart)

  const payments = paymentsData as { amount: number }[] | null
  const monthlyRevenue = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0)

  // Members trend (new this month vs last month)
  const { count: newMembersThisMonth } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('created_at', monthStart)

  const { count: newMembersLastMonth } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('created_at', lastMonthStart)
    .lt('created_at', lastMonthEnd)

  const membersTrend = (newMembersLastMonth || 0) > 0
    ? (((newMembersThisMonth || 0) - (newMembersLastMonth || 0)) / (newMembersLastMonth || 1)) * 100
    : 0

  // Check-ins trend (today vs yesterday)
  const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString()
  const { count: yesterdayCheckIns } = await supabase
    .from('check_ins')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('checked_in_at', yesterdayStart)
    .lt('checked_in_at', todayStart)

  const checkInsTrend = (yesterdayCheckIns || 0) > 0
    ? (((todayCheckIns || 0) - (yesterdayCheckIns || 0)) / (yesterdayCheckIns || 1)) * 100
    : 0

  return {
    data: {
      totalMembers: totalMembers || 0,
      activeMembers: activeMembers || 0,
      totalClasses: totalClasses || 0,
      todayClasses: todayClasses || 0,
      todayCheckIns: todayCheckIns || 0,
      monthlyRevenue,
      membersTrend: Math.round(membersTrend),
      checkInsTrend: Math.round(checkInsTrend),
    },
    error: null,
  }
}

export async function getRecentMembers(): Promise<{
  data: RecentMember[] | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  const profile = profileData as { organization_id: string | null } | null

  if (!profile?.organization_id) {
    return { data: null, error: 'No organization found' }
  }

  const { data, error } = await supabase
    .from('members')
    .select('id, full_name, email, status, created_at')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as RecentMember[], error: null }
}

export async function getUpcomingClasses(): Promise<{
  data: UpcomingClass[] | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  const profile = profileData as { organization_id: string | null } | null

  if (!profile?.organization_id) {
    return { data: null, error: 'No organization found' }
  }

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('classes')
    .select('id, name, class_type, start_time, current_bookings, max_capacity, instructor_name')
    .eq('organization_id', profile.organization_id)
    .eq('is_cancelled', false)
    .gte('start_time', now)
    .order('start_time', { ascending: true })
    .limit(5)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as UpcomingClass[], error: null }
}

// =============================================================================
// REVENUE CHART (Income vs Expenses by Day)
// =============================================================================

export async function getDashboardRevenueChart(params?: {
  period?: 'week' | 'month' | 'year'
}): Promise<{ data: RevenuePoint[] | null; error: string | null }> {
  const { authorized, user, error } = await requirePermission('view_gym_finances')

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()
  const now = new Date()
  const period = params?.period || 'week'

  // Calculate date range based on period
  let startDate: Date
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  switch (period) {
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1)
      break
    case 'week':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
      break
  }

  // Get payments (income from members)
  const { data: paymentsData } = await supabase
    .from('payments')
    .select('amount, payment_date')
    .eq('organization_id', user.organizationId)
    .eq('status', 'paid')
    .gte('payment_date', startDate.toISOString())
    .lt('payment_date', endDate.toISOString())

  // Get other income
  const { data: incomeData } = await supabase
    .from('income')
    .select('amount, income_date')
    .eq('organization_id', user.organizationId)
    .gte('income_date', startDate.toISOString())
    .lt('income_date', endDate.toISOString())

  // Get expenses
  const { data: expensesData } = await supabase
    .from('expenses')
    .select('amount, expense_date')
    .eq('organization_id', user.organizationId)
    .gte('expense_date', startDate.toISOString())
    .lt('expense_date', endDate.toISOString())

  // Group by day
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
  const revenueByDay: Map<string, { income: number; expense: number }> = new Map()

  // Initialize days
  const daysToShow = period === 'week' ? 7 : period === 'month' ? 30 : 12
  for (let i = 0; i < daysToShow; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const dayKey = period === 'year'
      ? date.toLocaleDateString('es-MX', { month: 'short' })
      : dayNames[date.getDay()]

    if (!revenueByDay.has(dayKey)) {
      revenueByDay.set(dayKey, { income: 0, expense: 0 })
    }
  }

  // Add payments
  const payments = paymentsData as { amount: number; payment_date: string }[] || []
  for (const p of payments) {
    const date = new Date(p.payment_date)
    const dayKey = period === 'year'
      ? date.toLocaleDateString('es-MX', { month: 'short' })
      : dayNames[date.getDay()]
    const current = revenueByDay.get(dayKey) || { income: 0, expense: 0 }
    current.income += Number(p.amount)
    revenueByDay.set(dayKey, current)
  }

  // Add other income
  const income = incomeData as { amount: number; income_date: string }[] || []
  for (const i of income) {
    const date = new Date(i.income_date)
    const dayKey = period === 'year'
      ? date.toLocaleDateString('es-MX', { month: 'short' })
      : dayNames[date.getDay()]
    const current = revenueByDay.get(dayKey) || { income: 0, expense: 0 }
    current.income += Number(i.amount)
    revenueByDay.set(dayKey, current)
  }

  // Add expenses
  const expenses = expensesData as { amount: number; expense_date: string }[] || []
  for (const e of expenses) {
    const date = new Date(e.expense_date)
    const dayKey = period === 'year'
      ? date.toLocaleDateString('es-MX', { month: 'short' })
      : dayNames[date.getDay()]
    const current = revenueByDay.get(dayKey) || { income: 0, expense: 0 }
    current.expense += Number(e.amount)
    revenueByDay.set(dayKey, current)
  }

  const result: RevenuePoint[] = Array.from(revenueByDay.entries()).map(([day, data]) => ({
    day,
    income: data.income,
    expense: data.expense,
  }))

  return { data: result, error: null }
}

// =============================================================================
// ACTIVITY BREAKDOWN (for Donut Chart)
// =============================================================================

export async function getActivityBreakdown(): Promise<{
  data: ActivityOverview | null
  error: string | null
}> {
  const { authorized, user, error } = await requireAnyPermission([
    'view_admin_dashboard',
    'view_trainer_dashboard',
  ])

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()
  const now = new Date()
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)

  // Get classes by type this week
  const { data: classesData } = await supabase
    .from('classes')
    .select('class_type')
    .eq('organization_id', user.organizationId)
    .eq('is_cancelled', false)
    .gte('start_time', weekStart.toISOString())

  const classes = classesData as { class_type: string | null }[] || []

  // Count by type
  const typeCount: Record<string, number> = {}
  let total = 0

  for (const c of classes) {
    const type = c.class_type || 'other'
    typeCount[type] = (typeCount[type] || 0) + 1
    total++
  }

  // Map class types to display names
  const classTypeLabels: Record<string, string> = {
    crossfit: 'CrossFit',
    yoga: 'Yoga',
    pilates: 'Pilates',
    spinning: 'Spinning',
    hiit: 'HIIT',
    strength: 'Entrenamiento de Fuerza',
    cardio: 'Cardio',
    functional: 'Funcional',
    boxing: 'Box',
    mma: 'MMA',
    stretching: 'Estiramiento',
    open_gym: 'Open Gym',
    personal: 'Personal',
    other: 'Otros',
  }

  // Colors for chart
  const colors = ['#1a1a2e', '#b8e986', '#e8e8e8', '#f0f0f0', '#a8d4a8', '#d4a8d4']

  // Create breakdown sorted by count
  const breakdown = Object.entries(typeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([type, count], index) => ({
      name: classTypeLabels[type] || type,
      value: count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      color: colors[index % colors.length],
    }))

  return {
    data: {
      total,
      period: 'Esta Semana',
      breakdown,
    },
    error: null,
  }
}

// =============================================================================
// TODAY'S TRAINER/INSTRUCTOR SCHEDULE
// =============================================================================

export async function getTodaySchedule(): Promise<{
  data: TrainerSchedule[] | null
  error: string | null
}> {
  const { authorized, user, error } = await requireAnyPermission([
    'view_admin_dashboard',
    'view_trainer_dashboard',
  ])

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

  // Get today's classes with instructor info
  const { data: classesData } = await supabase
    .from('classes')
    .select(`
      id,
      name,
      class_type,
      start_time,
      end_time,
      instructor_id,
      instructor_name
    `)
    .eq('organization_id', user.organizationId)
    .eq('is_cancelled', false)
    .gte('start_time', todayStart)
    .lt('start_time', todayEnd)
    .order('start_time', { ascending: true })

  const classes = classesData as Array<{
    id: string
    name: string
    class_type: string | null
    start_time: string
    end_time: string
    instructor_id: string | null
    instructor_name: string | null
  }> || []

  // Get unique instructors and their schedules
  const instructorSchedules: Map<string, TrainerSchedule> = new Map()

  for (const c of classes) {
    const instructorId = c.instructor_id || 'unknown'
    const instructorName = c.instructor_name || 'Sin asignar'

    if (!instructorSchedules.has(instructorId)) {
      const startTime = new Date(c.start_time)
      const endTime = new Date(c.end_time)

      instructorSchedules.set(instructorId, {
        id: instructorId,
        name: instructorName,
        role: c.class_type ? classTypeToRole(c.class_type) : 'Instructor',
        activity: c.name,
        startTime: startTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        endTime: endTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        status: 'available',
      })
    }
  }

  return {
    data: Array.from(instructorSchedules.values()).slice(0, 5),
    error: null,
  }
}

function classTypeToRole(classType: string): string {
  const roleMap: Record<string, string> = {
    yoga: 'Instructor de Yoga',
    crossfit: 'Entrenador CrossFit',
    pilates: 'Instructor de Pilates',
    spinning: 'Instructor de Spinning',
    hiit: 'Entrenador HIIT',
    strength: 'Entrenador de Fuerza',
    cardio: 'Instructor de Cardio',
    functional: 'Entrenador Funcional',
    boxing: 'Entrenador de Box',
    personal: 'Entrenador Personal',
  }
  return roleMap[classType] || 'Instructor'
}

// =============================================================================
// TODAY'S CLASS BOOKINGS
// =============================================================================

export async function getTodayBookings(): Promise<{
  data: ClientClass[] | null
  error: string | null
}> {
  const { authorized, user, error } = await requireAnyPermission([
    'view_admin_dashboard',
    'view_any_bookings',
  ])

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

  // Get today's bookings with class and member info
  const { data: bookingsData } = await supabase
    .from('class_bookings')
    .select(`
      id,
      status,
      member:members(id, full_name),
      class:classes(id, name, start_time, instructor_name)
    `)
    .eq('organization_id', user.organizationId)
    .gte('created_at', todayStart)
    .lt('created_at', todayEnd)
    .order('created_at', { ascending: false })
    .limit(10)

  const bookings = bookingsData as Array<{
    id: string
    status: string
    member: { id: string; full_name: string } | null
    class: { id: string; name: string; start_time: string; instructor_name: string | null } | null
  }> || []

  const result: ClientClass[] = bookings.map((b) => {
    const classTime = b.class?.start_time ? new Date(b.class.start_time) : new Date()
    return {
      id: b.id,
      name: b.member?.full_name || 'Miembro',
      date: classTime.toLocaleDateString('es-MX', { year: '2-digit', month: '2-digit', day: '2-digit' }),
      time: classTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      trainer: b.class?.instructor_name || 'Sin asignar',
      className: b.class?.name || 'Clase',
      status: mapBookingStatus(b.status),
    }
  })

  return { data: result, error: null }
}

function mapBookingStatus(status: string): 'confirmed' | 'pending' | 'cancelled' {
  switch (status) {
    case 'confirmed':
    case 'attended':
      return 'confirmed'
    case 'cancelled':
    case 'no_show':
      return 'cancelled'
    default:
      return 'pending'
  }
}

// =============================================================================
// RECENT ACTIVITY
// =============================================================================

export async function getRecentActivity(): Promise<{
  data: RecentActivity[] | null
  error: string | null
}> {
  const { authorized, user, error } = await requireAnyPermission([
    'view_admin_dashboard',
    'view_trainer_dashboard',
  ])

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  const activities: RecentActivity[] = []

  // Get recent check-ins
  const { data: checkInsData } = await supabase
    .from('check_ins')
    .select('id, checked_in_at, member:members(full_name)')
    .eq('organization_id', user.organizationId)
    .gte('checked_in_at', todayStart)
    .order('checked_in_at', { ascending: false })
    .limit(5)

  const checkIns = checkInsData as Array<{
    id: string
    checked_in_at: string
    member: { full_name: string } | null
  }> || []

  for (const ci of checkIns) {
    const time = new Date(ci.checked_in_at)
    activities.push({
      id: `checkin-${ci.id}`,
      message: `${ci.member?.full_name || 'Miembro'} hizo check-in`,
      time: time.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      type: 'session',
    })
  }

  // Get recent bookings
  const { data: bookingsData } = await supabase
    .from('class_bookings')
    .select('id, created_at, status, member:members(full_name), class:classes(name)')
    .eq('organization_id', user.organizationId)
    .gte('created_at', todayStart)
    .order('created_at', { ascending: false })
    .limit(5)

  const bookings = bookingsData as Array<{
    id: string
    created_at: string
    status: string
    member: { full_name: string } | null
    class: { name: string } | null
  }> || []

  for (const b of bookings) {
    const time = new Date(b.created_at)
    const statusText = b.status === 'cancelled' ? 'cancelo su reserva' : 'reservo'
    activities.push({
      id: `booking-${b.id}`,
      message: `${b.member?.full_name || 'Miembro'} ${statusText} ${b.class?.name || 'una clase'}`,
      time: time.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      type: b.status === 'cancelled' ? 'alert' : 'booking',
    })
  }

  // Sort by time and limit
  activities.sort((a, b) => {
    const timeA = a.time.replace(' AM', '').replace(' PM', '')
    const timeB = b.time.replace(' AM', '').replace(' PM', '')
    return timeB.localeCompare(timeA)
  })

  return { data: activities.slice(0, 8), error: null }
}

// =============================================================================
// CALENDAR EVENTS (Classes for a specific date)
// =============================================================================

export async function getCalendarEvents(params?: {
  date?: string // ISO date string
}): Promise<{
  data: CalendarEvent[] | null
  error: string | null
}> {
  const { authorized, user, error } = await requireAnyPermission([
    'view_admin_dashboard',
    'view_trainer_dashboard',
    'view_classes',
  ])

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()
  const targetDate = params?.date ? new Date(params.date) : new Date()
  const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).toISOString()
  const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1).toISOString()

  const { data: classesData } = await supabase
    .from('classes')
    .select('id, name, start_time, end_time, class_type')
    .eq('organization_id', user.organizationId)
    .eq('is_cancelled', false)
    .gte('start_time', dayStart)
    .lt('start_time', dayEnd)
    .order('start_time', { ascending: true })

  const classes = classesData as Array<{
    id: string
    name: string
    start_time: string
    end_time: string
    class_type: string | null
  }> || []

  const colorMap: Record<string, string> = {
    yoga: '#b8e986',
    crossfit: '#f87171',
    pilates: '#a78bfa',
    spinning: '#60a5fa',
    hiit: '#fbbf24',
    strength: '#f472b6',
    cardio: '#34d399',
    default: '#b8e986',
  }

  const events: CalendarEvent[] = classes.map((c) => {
    const startTime = new Date(c.start_time)
    const endTime = new Date(c.end_time)
    return {
      id: c.id,
      title: c.name,
      startTime: startTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }),
      endTime: endTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }),
      color: colorMap[c.class_type || 'default'] || colorMap.default,
    }
  })

  return { data: events, error: null }
}

// =============================================================================
// CHECK-INS CHART (by day)
// =============================================================================

export async function getCheckInsChart(params?: {
  days?: number
}): Promise<{
  data: Array<{ date: string; checkIns: number }> | null
  error: string | null
}> {
  const { authorized, user, error } = await requireAnyPermission([
    'view_admin_dashboard',
    'view_check_ins',
  ])

  if (!authorized || !user) {
    return { data: null, error: error || 'No autorizado' }
  }

  const supabase = await createClient()
  const now = new Date()
  const days = params?.days || 8
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1)

  const { data: checkInsData } = await supabase
    .from('check_ins')
    .select('checked_in_at')
    .eq('organization_id', user.organizationId)
    .gte('checked_in_at', startDate.toISOString())

  const checkIns = checkInsData as Array<{ checked_in_at: string }> || []

  // Group by day
  const checkInsByDay: Map<string, number> = new Map()

  // Initialize all days
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const dayKey = date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
    checkInsByDay.set(dayKey, 0)
  }

  // Count check-ins
  for (const ci of checkIns) {
    const date = new Date(ci.checked_in_at)
    const dayKey = date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
    const current = checkInsByDay.get(dayKey) || 0
    checkInsByDay.set(dayKey, current + 1)
  }

  const result = Array.from(checkInsByDay.entries()).map(([date, checkIns]) => ({
    date,
    checkIns,
  }))

  return { data: result, error: null }
}
