'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ActionState = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  data?: unknown
}

interface UserProfile {
  organization_id: string
  role: string
  userId: string
}

interface CheckIn {
  id: string
  organization_id: string
  member_id: string
  checked_in_at: string
  checked_out_at: string | null
  check_in_method: string
  location: string | null
  notes: string | null
  created_at: string
}

interface CheckInWithMember extends CheckIn {
  member?: {
    id: string
    full_name: string
    email: string
    status: string
    access_code: string | null
  }
}

async function getUserProfile(): Promise<{ profile: UserProfile | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { profile: null, error: 'No autenticado' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    return { profile: null, error: 'No se encontro la organizacion' }
  }

  const profileData = data as { organization_id: string | null; role: string }
  if (!profileData.organization_id) {
    return { profile: null, error: 'No se encontro la organizacion' }
  }

  return {
    profile: {
      organization_id: profileData.organization_id,
      role: profileData.role,
      userId: user.id
    },
    error: null
  }
}

// =============================================================================
// GET TODAY'S CHECK-INS
// =============================================================================

export async function getTodayCheckIns(): Promise<{
  data: CheckInWithMember[] | null
  error: string | null
}> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, error: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

  const { data, error } = await supabase
    .from('check_ins')
    .select(`
      *,
      member:members(id, full_name, email, status, access_code)
    `)
    .eq('organization_id', profile.organization_id)
    .gte('checked_in_at', todayStart)
    .lt('checked_in_at', todayEnd)
    .order('checked_in_at', { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as CheckInWithMember[], error: null }
}

// =============================================================================
// CHECK-IN BY ACCESS CODE (QR or PIN)
// =============================================================================

export async function checkInByAccessCode(
  accessCode: string,
  method: 'qr' | 'pin' = 'qr'
): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  // Find member by access code
  const { data: memberData, error: memberError } = await supabase
    .from('members')
    .select('id, full_name, status, access_code')
    .eq('organization_id', profile.organization_id)
    .eq('access_code', accessCode)
    .single()

  if (memberError || !memberData) {
    return { success: false, message: 'Codigo de acceso invalido' }
  }

  const member = memberData as {
    id: string
    full_name: string
    status: string
    access_code: string
  }

  if (member.status !== 'active') {
    return { success: false, message: `La membresia de ${member.full_name} no esta activa` }
  }

  // Check if already checked in today
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

  const { data: existingCheckIn } = await supabase
    .from('check_ins')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .eq('member_id', member.id)
    .gte('checked_in_at', todayStart)
    .lt('checked_in_at', todayEnd)
    .maybeSingle()

  if (existingCheckIn) {
    return { success: false, message: `${member.full_name} ya hizo check-in hoy` }
  }

  // Create check-in record
  const { data: checkIn, error: checkInError } = await supabase
    .from('check_ins')
    .insert({
      organization_id: profile.organization_id,
      member_id: member.id,
      checked_in_at: new Date().toISOString(),
      check_in_method: method,
    } as never)
    .select()
    .single()

  if (checkInError) {
    return { success: false, message: checkInError.message }
  }

  // Update member check-in count and last check-in
  const { data: currentMember } = await supabase
    .from('members')
    .select('check_in_count')
    .eq('id', member.id)
    .single()

  const memberInfo = currentMember as { check_in_count: number } | null

  await supabase
    .from('members')
    .update({
      check_in_count: (memberInfo?.check_in_count || 0) + 1,
      last_check_in: new Date().toISOString(),
    } as never)
    .eq('id', member.id)

  revalidatePath('/dashboard/check-in')
  revalidatePath('/dashboard')

  return {
    success: true,
    message: `Bienvenido, ${member.full_name}!`,
    data: { checkIn, member },
  }
}

// =============================================================================
// MANUAL CHECK-IN BY MEMBER ID
// =============================================================================

export async function manualCheckIn(memberId: string): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  // Find member
  const { data: memberData, error: memberError } = await supabase
    .from('members')
    .select('id, full_name, status')
    .eq('organization_id', profile.organization_id)
    .eq('id', memberId)
    .single()

  if (memberError || !memberData) {
    return { success: false, message: 'Miembro no encontrado' }
  }

  const member = memberData as { id: string; full_name: string; status: string }

  if (member.status !== 'active') {
    return { success: false, message: `La membresia de ${member.full_name} no esta activa` }
  }

  // Check if already checked in today
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

  const { data: existingCheckIn } = await supabase
    .from('check_ins')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .eq('member_id', member.id)
    .gte('checked_in_at', todayStart)
    .lt('checked_in_at', todayEnd)
    .maybeSingle()

  if (existingCheckIn) {
    return { success: false, message: `${member.full_name} ya hizo check-in hoy` }
  }

  // Create check-in record
  const { error: checkInError } = await supabase
    .from('check_ins')
    .insert({
      organization_id: profile.organization_id,
      member_id: member.id,
      checked_in_at: new Date().toISOString(),
      check_in_method: 'manual',
    } as never)

  if (checkInError) {
    return { success: false, message: checkInError.message }
  }

  // Update member check-in count and last check-in
  const { data: currentMember } = await supabase
    .from('members')
    .select('check_in_count')
    .eq('id', member.id)
    .single()

  const memberInfo = currentMember as { check_in_count: number } | null

  await supabase
    .from('members')
    .update({
      check_in_count: (memberInfo?.check_in_count || 0) + 1,
      last_check_in: new Date().toISOString(),
    } as never)
    .eq('id', member.id)

  revalidatePath('/dashboard/check-in')
  revalidatePath('/dashboard')

  return {
    success: true,
    message: `Check-in registrado para ${member.full_name}`,
  }
}

// =============================================================================
// GENERATE ACCESS CODE FOR MEMBER
// =============================================================================

export async function generateAccessCode(memberId: string): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  // Generate a random 6-digit code
  const accessCode = Math.random().toString().slice(2, 8)

  const { error } = await supabase
    .from('members')
    .update({ access_code: accessCode } as never)
    .eq('id', memberId)
    .eq('organization_id', profile.organization_id)

  if (error) {
    return { success: false, message: error.message }
  }

  revalidatePath(`/dashboard/members/${memberId}`)

  return {
    success: true,
    message: 'Codigo de acceso generado',
    data: { accessCode },
  }
}
