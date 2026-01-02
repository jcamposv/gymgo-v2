'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { bookingSchema, bookingUpdateSchema, type BookingFormData, type BookingUpdateData } from '@/schemas/booking.schema'

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

interface Booking {
  id: string
  organization_id: string
  class_id: string
  member_id: string
  status: string
  waitlist_position: number | null
  checked_in_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  workout_result: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

interface BookingWithDetails extends Booking {
  member?: {
    id: string
    full_name: string
    email: string
    status: string
  }
  class?: {
    id: string
    name: string
    start_time: string
    end_time: string
    instructor_name: string | null
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
// GET BOOKINGS
// =============================================================================

export async function getBookings(params?: {
  class_id?: string
  member_id?: string
  status?: string
  start_date?: string
  end_date?: string
  page?: number
  per_page?: number
}): Promise<{ data: BookingWithDetails[] | null; count: number; error: string | null }> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, count: 0, error: profileError ?? 'No profile found' }
  }

  const page = params?.page ?? 1
  const perPage = params?.per_page ?? 50
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const supabase = await createClient()

  let query = supabase
    .from('bookings')
    .select(`
      *,
      member:members(id, full_name, email, status),
      class:classes(id, name, start_time, end_time, instructor_name)
    `, { count: 'exact' })
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params?.class_id) {
    query = query.eq('class_id', params.class_id)
  }

  if (params?.member_id) {
    query = query.eq('member_id', params.member_id)
  }

  if (params?.status) {
    query = query.eq('status', params.status)
  }

  const { data, count, error } = await query

  if (error) {
    return { data: null, count: 0, error: error.message }
  }

  return { data: data as BookingWithDetails[], count: count ?? 0, error: null }
}

// =============================================================================
// GET BOOKINGS FOR CLASS
// =============================================================================

export async function getClassBookings(classId: string): Promise<{
  data: BookingWithDetails[] | null
  error: string | null
}> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, error: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      member:members(id, full_name, email, status)
    `)
    .eq('organization_id', profile.organization_id)
    .eq('class_id', classId)
    .order('created_at', { ascending: true })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as BookingWithDetails[], error: null }
}

// =============================================================================
// GET MEMBER BOOKINGS
// =============================================================================

export async function getMemberBookings(memberId: string): Promise<{
  data: BookingWithDetails[] | null
  error: string | null
}> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { data: null, error: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      class:classes(id, name, start_time, end_time, instructor_name)
    `)
    .eq('organization_id', profile.organization_id)
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as BookingWithDetails[], error: null }
}

// =============================================================================
// CREATE BOOKING
// =============================================================================

export async function createBooking(data: BookingFormData): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const validated = bookingSchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      message: 'Datos invalidos',
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  // Check if class exists and has capacity
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('id, max_capacity, current_bookings, waitlist_enabled, max_waitlist, is_cancelled')
    .eq('id', validated.data.class_id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (classError || !classData) {
    return { success: false, message: 'Clase no encontrada' }
  }

  const classInfo = classData as {
    id: string
    max_capacity: number
    current_bookings: number
    waitlist_enabled: boolean
    max_waitlist: number
    is_cancelled: boolean
  }

  if (classInfo.is_cancelled) {
    return { success: false, message: 'La clase ha sido cancelada' }
  }

  // Check if already booked
  const { data: existingBooking } = await supabase
    .from('bookings')
    .select('id')
    .eq('class_id', validated.data.class_id)
    .eq('member_id', validated.data.member_id)
    .neq('status', 'cancelled')
    .maybeSingle()

  if (existingBooking) {
    return { success: false, message: 'El miembro ya tiene una reserva para esta clase' }
  }

  // Determine booking status
  let status: 'confirmed' | 'waitlist' = 'confirmed'
  let waitlistPosition: number | null = null

  if (classInfo.current_bookings >= classInfo.max_capacity) {
    if (!classInfo.waitlist_enabled) {
      return { success: false, message: 'La clase esta llena y no tiene lista de espera' }
    }

    // Count current waitlist
    const { count: waitlistCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', validated.data.class_id)
      .eq('status', 'waitlist')

    if ((waitlistCount || 0) >= classInfo.max_waitlist) {
      return { success: false, message: 'La lista de espera esta llena' }
    }

    status = 'waitlist'
    waitlistPosition = (waitlistCount || 0) + 1
  }

  const insertData = {
    organization_id: profile.organization_id,
    class_id: validated.data.class_id,
    member_id: validated.data.member_id,
    status,
    waitlist_position: waitlistPosition,
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert(insertData as never)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, message: 'El miembro ya tiene una reserva para esta clase' }
    }
    return { success: false, message: error.message }
  }

  // Update class current_bookings count
  if (status === 'confirmed') {
    await supabase
      .from('classes')
      .update({ current_bookings: classInfo.current_bookings + 1 } as never)
      .eq('id', validated.data.class_id)
  }

  revalidatePath('/dashboard/classes')
  revalidatePath(`/dashboard/classes/${validated.data.class_id}`)
  revalidatePath(`/dashboard/members/${validated.data.member_id}`)

  return {
    success: true,
    message: status === 'waitlist'
      ? `Agregado a lista de espera (posicion ${waitlistPosition})`
      : 'Reserva confirmada',
    data: booking,
  }
}

// =============================================================================
// CANCEL BOOKING
// =============================================================================

export async function cancelBooking(
  bookingId: string,
  reason?: string
): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  // Get booking info
  const { data: bookingData, error: fetchError } = await supabase
    .from('bookings')
    .select('id, class_id, status')
    .eq('id', bookingId)
    .eq('organization_id', profile.organization_id)
    .single()

  if (fetchError || !bookingData) {
    return { success: false, message: 'Reserva no encontrada' }
  }

  const booking = bookingData as { id: string; class_id: string; status: string }

  if (booking.status === 'cancelled') {
    return { success: false, message: 'La reserva ya esta cancelada' }
  }

  const wasConfirmed = booking.status === 'confirmed'

  // Update booking
  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason || null,
    } as never)
    .eq('id', bookingId)
    .eq('organization_id', profile.organization_id)

  if (error) {
    return { success: false, message: error.message }
  }

  // If was confirmed, update class count and promote from waitlist
  if (wasConfirmed) {
    // Get current class info
    const { data: classData } = await supabase
      .from('classes')
      .select('current_bookings')
      .eq('id', booking.class_id)
      .single()

    const classInfo = classData as { current_bookings: number } | null

    if (classInfo) {
      // Update booking count
      await supabase
        .from('classes')
        .update({ current_bookings: Math.max(0, classInfo.current_bookings - 1) } as never)
        .eq('id', booking.class_id)

      // Promote first waitlist person
      const { data: waitlistBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('class_id', booking.class_id)
        .eq('status', 'waitlist')
        .order('waitlist_position', { ascending: true })
        .limit(1)

      const waitlist = waitlistBookings as { id: string }[] | null

      if (waitlist && waitlist.length > 0) {
        await supabase
          .from('bookings')
          .update({ status: 'confirmed', waitlist_position: null } as never)
          .eq('id', waitlist[0].id)

        // Reorder waitlist positions
        const { data: remainingWaitlist } = await supabase
          .from('bookings')
          .select('id, waitlist_position')
          .eq('class_id', booking.class_id)
          .eq('status', 'waitlist')
          .order('waitlist_position', { ascending: true })

        const remaining = remainingWaitlist as { id: string; waitlist_position: number }[] | null

        if (remaining) {
          for (let i = 0; i < remaining.length; i++) {
            await supabase
              .from('bookings')
              .update({ waitlist_position: i + 1 } as never)
              .eq('id', remaining[i].id)
          }
        }
      }
    }
  }

  revalidatePath('/dashboard/classes')
  revalidatePath(`/dashboard/classes/${booking.class_id}`)

  return {
    success: true,
    message: 'Reserva cancelada',
  }
}

// =============================================================================
// CHECK IN BOOKING
// =============================================================================

export async function checkInBooking(bookingId: string): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  // Get booking info
  const { data: bookingData, error: fetchError } = await supabase
    .from('bookings')
    .select('id, status, checked_in_at, member_id')
    .eq('id', bookingId)
    .eq('organization_id', profile.organization_id)
    .single()

  if (fetchError || !bookingData) {
    return { success: false, message: 'Reserva no encontrada' }
  }

  const booking = bookingData as {
    id: string
    status: string
    checked_in_at: string | null
    member_id: string
  }

  if (booking.status === 'cancelled') {
    return { success: false, message: 'No se puede hacer check-in de una reserva cancelada' }
  }

  if (booking.checked_in_at) {
    return { success: false, message: 'El check-in ya fue realizado' }
  }

  // Update booking with check-in
  const { error } = await supabase
    .from('bookings')
    .update({
      checked_in_at: new Date().toISOString(),
      status: 'confirmed',
    } as never)
    .eq('id', bookingId)
    .eq('organization_id', profile.organization_id)

  if (error) {
    return { success: false, message: error.message }
  }

  // Update member check-in count and last check-in
  const { data: memberData } = await supabase
    .from('members')
    .select('check_in_count')
    .eq('id', booking.member_id)
    .single()

  const member = memberData as { check_in_count: number } | null

  if (member) {
    await supabase
      .from('members')
      .update({
        check_in_count: (member.check_in_count || 0) + 1,
        last_check_in: new Date().toISOString(),
      } as never)
      .eq('id', booking.member_id)
  }

  // Create check-in record
  await supabase
    .from('check_ins')
    .insert({
      organization_id: profile.organization_id,
      member_id: booking.member_id,
      checked_in_at: new Date().toISOString(),
      check_in_method: 'manual',
    } as never)

  revalidatePath('/dashboard/classes')

  return {
    success: true,
    message: 'Check-in realizado',
  }
}

// =============================================================================
// MARK NO SHOW
// =============================================================================

export async function markNoShow(bookingId: string): Promise<ActionState> {
  const { profile, error: profileError } = await getUserProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No profile found' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'no_show' } as never)
    .eq('id', bookingId)
    .eq('organization_id', profile.organization_id)

  if (error) {
    return { success: false, message: error.message }
  }

  revalidatePath('/dashboard/classes')

  return {
    success: true,
    message: 'Marcado como no asistio',
  }
}
