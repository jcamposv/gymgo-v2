'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/database.types'

// =============================================================================
// TYPES
// =============================================================================

export type ActionState = {
  success: boolean
  message: string
  data?: unknown
}

interface MemberProfile {
  userId: string
  email: string
  organization_id: string
  memberId: string
}

export interface BookingWithClass {
  id: string
  status: string
  waitlist_position: number | null
  checked_in_at: string | null
  cancelled_at: string | null
  created_at: string
  class: {
    id: string
    name: string
    class_type: string | null
    start_time: string
    end_time: string
    instructor_name: string | null
    location: string | null
    max_capacity: number
    current_bookings: number
    is_cancelled: boolean
    cancellation_deadline_hours: number
  }
}

export interface AvailableClass {
  id: string
  name: string
  description: string | null
  class_type: string | null
  start_time: string
  end_time: string
  instructor_name: string | null
  location: string | null
  max_capacity: number
  current_bookings: number
  waitlist_enabled: boolean
  max_waitlist: number
  booking_opens_hours: number
  booking_closes_minutes: number
  is_cancelled: boolean
  hasMyBooking: boolean
  myBookingStatus: string | null
  myBookingId: string | null
}

// =============================================================================
// HELPER: Get member profile from current user
// =============================================================================

async function getMemberProfile(): Promise<{ profile: MemberProfile | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { profile: null, error: 'No autenticado' }
  }

  // Get profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id, email')
    .eq('id', user.id)
    .single()

  if (profileError || !profileData) {
    return { profile: null, error: 'No se encontro tu perfil' }
  }

  const profile = profileData as { organization_id: string | null; email: string }
  if (!profile.organization_id) {
    return { profile: null, error: 'No se encontro la organizacion' }
  }

  // Get member by email
  const { data: memberData, error: memberError } = await supabase
    .from('members')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .eq('email', profile.email)
    .single()

  if (memberError || !memberData) {
    return { profile: null, error: 'No tienes un perfil de miembro asociado' }
  }

  const member = memberData as { id: string }

  return {
    profile: {
      userId: user.id,
      email: profile.email,
      organization_id: profile.organization_id,
      memberId: member.id,
    },
    error: null,
  }
}

// =============================================================================
// GET MY BOOKINGS (Future classes I have reserved)
// =============================================================================

export async function getMyClassBookings(): Promise<{
  data: BookingWithClass[] | null
  memberId: string | null
  error: string | null
}> {
  const { profile, error: profileError } = await getMemberProfile()
  if (profileError || !profile) {
    return { data: null, memberId: null, error: profileError }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      waitlist_position,
      checked_in_at,
      cancelled_at,
      created_at,
      class:classes!inner (
        id,
        name,
        class_type,
        start_time,
        end_time,
        instructor_name,
        location,
        max_capacity,
        current_bookings,
        is_cancelled,
        cancellation_deadline_hours
      )
    `)
    .eq('member_id', profile.memberId)
    .in('status', ['confirmed', 'waitlist'])
    .gte('class.start_time', new Date().toISOString())
    .order('class(start_time)', { ascending: true })

  if (error) {
    console.error('Error fetching bookings:', error)
    return { data: null, memberId: profile.memberId, error: 'Error al cargar tus reservas' }
  }

  // Transform to expected format
  const bookings: BookingWithClass[] = (data || []).map((b: Record<string, unknown>) => ({
    id: b.id as string,
    status: b.status as string,
    waitlist_position: b.waitlist_position as number | null,
    checked_in_at: b.checked_in_at as string | null,
    cancelled_at: b.cancelled_at as string | null,
    created_at: b.created_at as string,
    class: b.class as BookingWithClass['class'],
  }))

  return { data: bookings, memberId: profile.memberId, error: null }
}

// =============================================================================
// GET MY CLASS HISTORY (Past classes I attended or missed)
// =============================================================================

export async function getMyClassHistory(): Promise<{
  data: BookingWithClass[] | null
  memberId: string | null
  error: string | null
}> {
  const { profile, error: profileError } = await getMemberProfile()
  if (profileError || !profile) {
    return { data: null, memberId: null, error: profileError }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      waitlist_position,
      checked_in_at,
      cancelled_at,
      created_at,
      class:classes!inner (
        id,
        name,
        class_type,
        start_time,
        end_time,
        instructor_name,
        location,
        max_capacity,
        current_bookings,
        is_cancelled,
        cancellation_deadline_hours
      )
    `)
    .eq('member_id', profile.memberId)
    .in('status', ['confirmed', 'attended', 'no_show'])
    .lt('class.start_time', new Date().toISOString())
    .order('class(start_time)', { ascending: false })

  if (error) {
    console.error('Error fetching history:', error)
    return { data: null, memberId: profile.memberId, error: 'Error al cargar tu historial' }
  }

  // Transform to expected format
  const bookings: BookingWithClass[] = (data || []).map((b: Record<string, unknown>) => ({
    id: b.id as string,
    status: b.status as string,
    waitlist_position: b.waitlist_position as number | null,
    checked_in_at: b.checked_in_at as string | null,
    cancelled_at: b.cancelled_at as string | null,
    created_at: b.created_at as string,
    class: b.class as BookingWithClass['class'],
  }))

  return { data: bookings, memberId: profile.memberId, error: null }
}

// =============================================================================
// GET AVAILABLE CLASSES (Upcoming classes from the gym)
// =============================================================================

export async function getAvailableClasses(): Promise<{
  data: AvailableClass[] | null
  memberId: string | null
  error: string | null
}> {
  const { profile, error: profileError } = await getMemberProfile()
  if (profileError || !profile) {
    return { data: null, memberId: null, error: profileError }
  }

  const supabase = await createClient()

  // Get upcoming classes
  const { data: classesData, error: classesError } = await supabase
    .from('classes')
    .select(`
      id,
      name,
      description,
      class_type,
      start_time,
      end_time,
      instructor_name,
      location,
      max_capacity,
      current_bookings,
      waitlist_enabled,
      max_waitlist,
      booking_opens_hours,
      booking_closes_minutes,
      is_cancelled
    `)
    .eq('organization_id', profile.organization_id)
    .eq('is_cancelled', false)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(50)

  if (classesError) {
    console.error('Error fetching classes:', classesError)
    return { data: null, memberId: profile.memberId, error: 'Error al cargar las clases' }
  }

  // Get member's current bookings for these classes
  const classIds = (classesData || []).map((c: Record<string, unknown>) => c.id as string)

  let myBookingsMap = new Map<string, { id: string; status: string }>()

  if (classIds.length > 0) {
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('id, class_id, status')
      .eq('member_id', profile.memberId)
      .in('class_id', classIds)
      .neq('status', 'cancelled')

    if (bookingsData) {
      for (const b of bookingsData as Array<{ id: string; class_id: string; status: string }>) {
        myBookingsMap.set(b.class_id, { id: b.id, status: b.status })
      }
    }
  }

  // Transform to expected format with booking info
  const classes: AvailableClass[] = (classesData || []).map((c: Record<string, unknown>) => {
    const myBooking = myBookingsMap.get(c.id as string)
    return {
      id: c.id as string,
      name: c.name as string,
      description: c.description as string | null,
      class_type: c.class_type as string | null,
      start_time: c.start_time as string,
      end_time: c.end_time as string,
      instructor_name: c.instructor_name as string | null,
      location: c.location as string | null,
      max_capacity: c.max_capacity as number,
      current_bookings: c.current_bookings as number,
      waitlist_enabled: c.waitlist_enabled as boolean,
      max_waitlist: c.max_waitlist as number,
      booking_opens_hours: c.booking_opens_hours as number,
      booking_closes_minutes: c.booking_closes_minutes as number,
      is_cancelled: c.is_cancelled as boolean,
      hasMyBooking: !!myBooking,
      myBookingStatus: myBooking?.status || null,
      myBookingId: myBooking?.id || null,
    }
  })

  return { data: classes, memberId: profile.memberId, error: null }
}

// =============================================================================
// RESERVE CLASS (Member reserves a class for themselves)
// =============================================================================

export async function reserveClass(classId: string): Promise<ActionState> {
  const { profile, error: profileError } = await getMemberProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No autenticado' }
  }

  const supabase = await createClient()

  // Get class info
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select(`
      id,
      name,
      start_time,
      max_capacity,
      current_bookings,
      waitlist_enabled,
      max_waitlist,
      booking_opens_hours,
      booking_closes_minutes,
      is_cancelled
    `)
    .eq('id', classId)
    .eq('organization_id', profile.organization_id)
    .single()

  if (classError || !classData) {
    return { success: false, message: 'Clase no encontrada' }
  }

  const classInfo = classData as {
    id: string
    name: string
    start_time: string
    max_capacity: number
    current_bookings: number
    waitlist_enabled: boolean
    max_waitlist: number
    booking_opens_hours: number
    booking_closes_minutes: number
    is_cancelled: boolean
  }

  // Validations
  if (classInfo.is_cancelled) {
    return { success: false, message: 'La clase ha sido cancelada' }
  }

  const classStart = new Date(classInfo.start_time)
  const now = new Date()

  // Check if class is in the past
  if (classStart <= now) {
    return { success: false, message: 'No puedes reservar una clase que ya comenzo' }
  }

  // Check if booking is still open (before booking_closes_minutes)
  const closeTime = new Date(classStart.getTime() - classInfo.booking_closes_minutes * 60 * 1000)
  if (now > closeTime) {
    return { success: false, message: `Las reservas cierran ${classInfo.booking_closes_minutes} minutos antes de la clase` }
  }

  // Check if booking is open yet (booking_opens_hours before class)
  const openTime = new Date(classStart.getTime() - classInfo.booking_opens_hours * 60 * 60 * 1000)
  if (now < openTime) {
    const daysUntilOpen = Math.ceil((openTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return {
      success: false,
      message: `Las reservas abren ${classInfo.booking_opens_hours / 24} dias antes de la clase (faltan ${daysUntilOpen} dias)`
    }
  }

  // Check if already booked
  const { data: existingBooking } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('class_id', classId)
    .eq('member_id', profile.memberId)
    .neq('status', 'cancelled')
    .maybeSingle()

  if (existingBooking) {
    const booking = existingBooking as { id: string; status: string }
    if (booking.status === 'confirmed') {
      return { success: false, message: 'Ya tienes una reserva confirmada para esta clase' }
    }
    if (booking.status === 'waitlist') {
      return { success: false, message: 'Ya estas en la lista de espera para esta clase' }
    }
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
      .eq('class_id', classId)
      .eq('status', 'waitlist')

    if ((waitlistCount || 0) >= classInfo.max_waitlist) {
      return { success: false, message: 'La lista de espera esta llena' }
    }

    status = 'waitlist'
    waitlistPosition = (waitlistCount || 0) + 1
  }

  // Create booking
  const { data: booking, error: insertError } = await supabase
    .from('bookings')
    .insert({
      organization_id: profile.organization_id,
      class_id: classId,
      member_id: profile.memberId,
      status,
      waitlist_position: waitlistPosition,
    } as never)
    .select()
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      return { success: false, message: 'Ya tienes una reserva para esta clase' }
    }
    console.error('Error creating booking:', insertError)
    return { success: false, message: 'Error al crear la reserva' }
  }

  // Update class booking count if confirmed
  if (status === 'confirmed') {
    await supabase
      .from('classes')
      .update({ current_bookings: classInfo.current_bookings + 1 } as never)
      .eq('id', classId)
  }

  revalidatePath('/member/classes')
  revalidatePath('/dashboard/classes')
  revalidatePath(`/dashboard/classes/${classId}`)

  return {
    success: true,
    message: status === 'waitlist'
      ? `Te agregamos a la lista de espera (posicion ${waitlistPosition})`
      : `Reserva confirmada para ${classInfo.name}`,
    data: booking,
  }
}

// =============================================================================
// CANCEL MY RESERVATION
// =============================================================================

export async function cancelMyReservation(bookingId: string): Promise<ActionState> {
  const { profile, error: profileError } = await getMemberProfile()
  if (profileError || !profile) {
    return { success: false, message: profileError ?? 'No autenticado' }
  }

  const supabase = await createClient()

  // Get booking info with class details
  const { data: bookingData, error: fetchError } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      class_id,
      class:classes (
        id,
        name,
        start_time,
        current_bookings,
        cancellation_deadline_hours
      )
    `)
    .eq('id', bookingId)
    .eq('member_id', profile.memberId)
    .single()

  if (fetchError || !bookingData) {
    return { success: false, message: 'Reserva no encontrada' }
  }

  const booking = bookingData as {
    id: string
    status: string
    class_id: string
    class: {
      id: string
      name: string
      start_time: string
      current_bookings: number
      cancellation_deadline_hours: number
    }
  }

  if (booking.status === 'cancelled') {
    return { success: false, message: 'La reserva ya esta cancelada' }
  }

  if (booking.status === 'attended' || booking.status === 'no_show') {
    return { success: false, message: 'No puedes cancelar una clase que ya ocurrio' }
  }

  // Check cancellation deadline
  const classStart = new Date(booking.class.start_time)
  const now = new Date()
  const deadlineTime = new Date(classStart.getTime() - booking.class.cancellation_deadline_hours * 60 * 60 * 1000)

  if (now > deadlineTime) {
    return {
      success: false,
      message: `No puedes cancelar con menos de ${booking.class.cancellation_deadline_hours} horas de anticipacion`,
    }
  }

  const wasConfirmed = booking.status === 'confirmed'

  // Update booking
  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: 'Cancelado por el miembro',
    } as never)
    .eq('id', bookingId)

  if (updateError) {
    console.error('Error cancelling booking:', updateError)
    return { success: false, message: 'Error al cancelar la reserva' }
  }

  // If was confirmed, update class count and promote from waitlist
  if (wasConfirmed) {
    // Update booking count
    await supabase
      .from('classes')
      .update({ current_bookings: Math.max(0, booking.class.current_bookings - 1) } as never)
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

      // Update class booking count back up
      await supabase
        .from('classes')
        .update({ current_bookings: booking.class.current_bookings } as never)
        .eq('id', booking.class_id)

      // Reorder remaining waitlist positions
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

  revalidatePath('/member/classes')
  revalidatePath('/dashboard/classes')
  revalidatePath(`/dashboard/classes/${booking.class_id}`)

  return {
    success: true,
    message: 'Tu reserva ha sido cancelada',
  }
}
