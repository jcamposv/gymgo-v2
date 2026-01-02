'use server'

import { createClient } from '@/lib/supabase/server'

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
