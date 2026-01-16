import { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// TYPES
// =============================================================================

export interface DailyBookingInfo {
  id: string
  className: string
  startTime: string
  status: string
}

export interface DailyBookingCount {
  count: number
  bookings: DailyBookingInfo[]
}

export interface DailyLimitCheckResult {
  canBook: boolean
  currentCount: number
  limit: number | null
  existingBookings: DailyBookingInfo[]
  targetDate: string
  timezone: string
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Obtiene el inicio y fin de un día en una zona horaria específica
 */
function getDayBoundsInTimezone(date: Date, timezone: string): { start: string; end: string } {
  // Formatear la fecha en la zona horaria del gym
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const dateStr = formatter.format(date) // YYYY-MM-DD

  // Crear fechas de inicio y fin del día en la zona horaria del gym
  // Usamos una aproximación: el día comienza a 00:00 y termina a 23:59:59
  const startOfDay = new Date(`${dateStr}T00:00:00`)
  const endOfDay = new Date(`${dateStr}T23:59:59.999`)

  // Para manejar correctamente la zona horaria, calculamos el offset
  // y ajustamos las fechas para obtener el rango correcto en UTC
  const targetDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  const offsetMs = utcDate.getTime() - targetDate.getTime()

  // Ajustar al inicio del día en la zona horaria del gym, convertido a UTC
  const startUTC = new Date(startOfDay.getTime() + offsetMs)
  const endUTC = new Date(endOfDay.getTime() + offsetMs)

  return {
    start: startUTC.toISOString(),
    end: endUTC.toISOString(),
  }
}

/**
 * Formatea una fecha como YYYY-MM-DD en una zona horaria específica
 */
function formatDateInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Cuenta las reservas activas de un miembro para un día específico
 * considerando la zona horaria del gimnasio.
 */
export async function getMemberDailyBookingCount(
  supabase: SupabaseClient,
  params: {
    memberId: string
    organizationId: string
    targetDate: Date
    timezone: string
    excludeBookingId?: string
  }
): Promise<DailyBookingCount> {
  const { memberId, organizationId, targetDate, timezone, excludeBookingId } = params

  const { start, end } = getDayBoundsInTimezone(targetDate, timezone)

  // Estados que cuentan hacia el límite diario
  const countingStatuses = ['confirmed', 'waitlist', 'attended', 'no_show']

  let query = supabase
    .from('bookings')
    .select(`
      id,
      status,
      class:classes!inner (
        id,
        name,
        start_time
      )
    `)
    .eq('member_id', memberId)
    .eq('organization_id', organizationId)
    .in('status', countingStatuses)
    .gte('class.start_time', start)
    .lte('class.start_time', end)

  if (excludeBookingId) {
    query = query.neq('id', excludeBookingId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error counting daily bookings:', error)
    return { count: 0, bookings: [] }
  }

  const bookings: DailyBookingInfo[] = (data || []).map((b: Record<string, unknown>) => {
    const classData = b.class as { id: string; name: string; start_time: string } | null
    return {
      id: b.id as string,
      className: classData?.name || 'Clase',
      startTime: classData?.start_time || '',
      status: b.status as string,
    }
  })

  return {
    count: bookings.length,
    bookings,
  }
}

/**
 * Verifica si el miembro puede reservar una clase considerando el límite diario.
 * Esta es la función principal que se usa en las validaciones de booking.
 */
export async function checkDailyBookingLimit(
  supabase: SupabaseClient,
  params: {
    memberId: string
    organizationId: string
    classStartTime: string
    maxClassesPerDay: number | null
    timezone: string
    excludeBookingId?: string
  }
): Promise<DailyLimitCheckResult> {
  const { memberId, organizationId, classStartTime, maxClassesPerDay, timezone, excludeBookingId } = params

  const targetDate = new Date(classStartTime)
  const formattedDate = formatDateInTimezone(targetDate, timezone)

  // Sin límite configurado = siempre puede reservar
  if (maxClassesPerDay === null || maxClassesPerDay === 0) {
    return {
      canBook: true,
      currentCount: 0,
      limit: null,
      existingBookings: [],
      targetDate: formattedDate,
      timezone,
    }
  }

  const { count, bookings } = await getMemberDailyBookingCount(supabase, {
    memberId,
    organizationId,
    targetDate,
    timezone,
    excludeBookingId,
  })

  return {
    canBook: count < maxClassesPerDay,
    currentCount: count,
    limit: maxClassesPerDay,
    existingBookings: bookings,
    targetDate: formattedDate,
    timezone,
  }
}

/**
 * Obtiene la configuración de límite diario de una organización.
 * Útil para obtener el setting junto con el timezone.
 */
export async function getOrganizationBookingLimits(
  supabase: SupabaseClient,
  organizationId: string
): Promise<{ maxClassesPerDay: number | null; timezone: string } | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('max_classes_per_day, timezone')
    .eq('id', organizationId)
    .single()

  if (error || !data) {
    console.error('Error fetching organization booking limits:', error)
    return null
  }

  const org = data as { max_classes_per_day: number | null; timezone: string | null }

  return {
    maxClassesPerDay: org.max_classes_per_day,
    timezone: org.timezone || 'America/Mexico_City',
  }
}

/**
 * Verifica el límite diario para múltiples fechas (útil para calendario).
 * Retorna un mapa de fecha -> info de límite.
 */
export async function checkDailyLimitsForDates(
  supabase: SupabaseClient,
  params: {
    memberId: string
    organizationId: string
    dates: string[] // Array de fechas ISO
    maxClassesPerDay: number | null
    timezone: string
  }
): Promise<Map<string, { count: number; isLimitReached: boolean }>> {
  const { memberId, organizationId, dates, maxClassesPerDay, timezone } = params
  const result = new Map<string, { count: number; isLimitReached: boolean }>()

  // Sin límite = todas las fechas disponibles
  if (maxClassesPerDay === null || maxClassesPerDay === 0) {
    for (const date of dates) {
      result.set(date, { count: 0, isLimitReached: false })
    }
    return result
  }

  // Para cada fecha, contar reservas
  for (const dateStr of dates) {
    const targetDate = new Date(dateStr)
    const { count } = await getMemberDailyBookingCount(supabase, {
      memberId,
      organizationId,
      targetDate,
      timezone,
    })

    const formattedDate = formatDateInTimezone(targetDate, timezone)
    result.set(formattedDate, {
      count,
      isLimitReached: count >= maxClassesPerDay,
    })
  }

  return result
}
