'use client'

import { useCallback, useMemo } from 'react'
import { useOrganization } from './use-organization'
import {
  formatCurrency,
  formatCurrencyCompact,
  getCurrencySymbol,
  getCurrencyConfig,
} from '@/lib/utils'

/**
 * Hook para acceder a la moneda de la organización actual
 * y funciones de formateo de moneda
 *
 * @example
 * const { currency, format, symbol } = useOrganizationCurrency()
 * format(1500) // "₡1,500" (si la org está en Costa Rica)
 */
export function useOrganizationCurrency() {
  const { organization, loading } = useOrganization()

  // Valores de la organización o defaults
  const currency = organization?.currency || 'MXN'
  const country = organization?.country || 'MX'
  const timezone = organization?.timezone || 'America/Mexico_City'

  // Obtener símbolo y configuración de la moneda
  const symbol = useMemo(() => getCurrencySymbol(currency), [currency])
  const config = useMemo(() => getCurrencyConfig(currency), [currency])

  /**
   * Formatea un monto en la moneda de la organización
   */
  const format = useCallback(
    (amount: number) => formatCurrency(amount, { currency }),
    [currency]
  )

  /**
   * Formatea un monto de forma compacta
   */
  const formatCompact = useCallback(
    (amount: number) => formatCurrencyCompact(amount, currency),
    [currency]
  )

  /**
   * Formatea un monto con opciones personalizadas
   */
  const formatWithOptions = useCallback(
    (
      amount: number,
      options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
    ) =>
      formatCurrency(amount, {
        currency,
        ...options,
      }),
    [currency]
  )

  return {
    // Datos de la organización
    currency,
    country,
    timezone,
    symbol,
    config,
    loading,

    // Funciones de formateo
    format,
    formatCompact,
    formatWithOptions,

    // Helper para mostrar en inputs
    inputPrefix: symbol,
  }
}

/**
 * Hook para obtener solo el código de moneda
 * Útil cuando solo necesitas el código sin las funciones de formateo
 */
export function useOrgCurrency(): string {
  const { organization } = useOrganization()
  return organization?.currency || 'MXN'
}
