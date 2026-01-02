/**
 * Date formatting utilities for Spanish locale
 * Uses DD/MM/YYYY format preferred in Latin America
 */

import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Format date as DD/MM/YYYY
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy', { locale: es })
}

/**
 * Format date with time as DD/MM/YYYY - HH:mm
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy - HH:mm', { locale: es })
}

/**
 * Format date for display in cards: DD MMM YYYY, HH:mm
 */
export function formatDateTimeLong(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "dd/MM/yyyy, HH:mm", { locale: es })
}

/**
 * Format date for notes: d MMM yyyy, HH:mm
 */
export function formatNoteDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "d 'de' MMM yyyy, HH:mm", { locale: es })
}

/**
 * Format appointment date: EEE, dd MMMM yyyy - HH:mm
 */
export function formatAppointmentDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "EEE, dd 'de' MMMM yyyy - HH:mm", { locale: es })
}

/**
 * Format membership validity: DD/MM
 */
export function formatValidityDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM', { locale: es })
}

/**
 * Format date of birth for display: dd/MM/yyyy
 */
export function formatBirthDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy', { locale: es })
}
