import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { CURRENCY_OPTIONS } from "@/schemas/onboarding.schema"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// =============================================================================
// CURRENCY FORMATTING UTILITIES
// =============================================================================

interface FormatCurrencyOptions {
  currency: string
  locale?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  /**
   * Use compact notation for large numbers (e.g., 1.5K, 2.3M)
   */
  compact?: boolean
}

/**
 * Formatea un monto en la moneda especificada
 * Usa el locale correcto para cada moneda automáticamente
 *
 * @example
 * formatCurrency(1500, { currency: 'MXN' }) // "$1,500.00"
 * formatCurrency(1500, { currency: 'CRC' }) // "₡1.500,00"
 */
export function formatCurrency(
  amount: number,
  options: FormatCurrencyOptions
): string {
  const { currency, minimumFractionDigits, maximumFractionDigits, compact } = options

  // Buscar configuración de la moneda
  const currencyConfig = CURRENCY_OPTIONS.find(c => c.value === currency)
  const locale = options.locale || currencyConfig?.locale || 'es-MX'

  // Monedas que no usan decimales
  const noDecimalCurrencies = ['CLP', 'PYG', 'COP', 'CRC']
  const defaultFractionDigits = noDecimalCurrencies.includes(currency) ? 0 : 2

  try {
    const formatOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency,
      minimumFractionDigits: minimumFractionDigits ?? defaultFractionDigits,
      maximumFractionDigits: maximumFractionDigits ?? defaultFractionDigits,
    }

    // Add compact notation for large numbers
    if (compact) {
      formatOptions.notation = 'compact'
      formatOptions.compactDisplay = 'short'
    }

    return new Intl.NumberFormat(locale, formatOptions).format(amount)
  } catch {
    // Fallback si la moneda no es soportada por Intl
    const symbol = currencyConfig?.symbol || '$'
    return `${symbol}${amount.toLocaleString()}`
  }
}

/**
 * Obtiene el símbolo de una moneda
 *
 * @example
 * getCurrencySymbol('MXN') // "$"
 * getCurrencySymbol('CRC') // "₡"
 */
export function getCurrencySymbol(currency: string): string {
  const config = CURRENCY_OPTIONS.find(c => c.value === currency)
  return config?.symbol || '$'
}

/**
 * Obtiene la configuración completa de una moneda
 */
export function getCurrencyConfig(currency: string) {
  return CURRENCY_OPTIONS.find(c => c.value === currency)
}

/**
 * Formatea un monto de forma compacta (sin decimales para monedas que no los usan)
 *
 * @example
 * formatCurrencyCompact(1500, 'CLP') // "$1.500"
 * formatCurrencyCompact(1500.50, 'USD') // "$1,500.50"
 */
export function formatCurrencyCompact(amount: number, currency: string): string {
  return formatCurrency(amount, { currency })
}

/**
 * Parsea un string de moneda a número
 * Remueve símbolos, espacios y convierte separadores
 */
export function parseCurrencyString(value: string): number {
  // Remover todo excepto números, puntos y comas
  const cleaned = value.replace(/[^\d.,\-]/g, '')

  // Determinar si usa coma como decimal (formato europeo/latam)
  const hasCommaDecimal = cleaned.match(/,\d{1,2}$/)

  if (hasCommaDecimal) {
    // Formato: 1.234,56 → 1234.56
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'))
  } else {
    // Formato: 1,234.56 → 1234.56
    return parseFloat(cleaned.replace(/,/g, ''))
  }
}
