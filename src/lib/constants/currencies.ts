// =============================================================================
// CURRENCIES - Shared currency definitions for the entire application
// =============================================================================

export interface Currency {
  code: string
  name: string
  symbol: string
}

export const CURRENCIES: Currency[] = [
  // Principales
  { code: 'USD', name: 'Dolar Estadounidense', symbol: '$' },
  { code: 'MXN', name: 'Peso Mexicano', symbol: '$' },
  { code: 'COP', name: 'Peso Colombiano', symbol: '$' },
  { code: 'ARS', name: 'Peso Argentino', symbol: '$' },
  { code: 'CLP', name: 'Peso Chileno', symbol: '$' },
  { code: 'PEN', name: 'Sol Peruano', symbol: 'S/' },
  { code: 'BRL', name: 'Real Brasileno', symbol: 'R$' },
  // Centroamerica y Caribe
  { code: 'CRC', name: 'Colon Costarricense', symbol: '₡' },
  { code: 'GTQ', name: 'Quetzal Guatemalteco', symbol: 'Q' },
  { code: 'HNL', name: 'Lempira Hondureno', symbol: 'L' },
  { code: 'NIO', name: 'Cordoba Nicaraguense', symbol: 'C$' },
  { code: 'PAB', name: 'Balboa Panameno', symbol: 'B/.' },
  { code: 'DOP', name: 'Peso Dominicano', symbol: 'RD$' },
  { code: 'CUP', name: 'Peso Cubano', symbol: '$' },
  // Sudamerica
  { code: 'UYU', name: 'Peso Uruguayo', symbol: '$U' },
  { code: 'PYG', name: 'Guarani Paraguayo', symbol: '₲' },
  { code: 'BOB', name: 'Boliviano', symbol: 'Bs' },
  { code: 'VES', name: 'Bolivar Venezolano', symbol: 'Bs.S' },
  // Otros
  { code: 'EUR', name: 'Euro', symbol: '€' },
]

export const CURRENCY_CODES = CURRENCIES.map(c => c.code) as [string, ...string[]]

/**
 * Get currency by code
 */
export function getCurrency(code: string): Currency | undefined {
  return CURRENCIES.find(c => c.code === code)
}

/**
 * Get currency symbol by code
 */
export function getCurrencySymbol(code: string): string {
  return getCurrency(code)?.symbol ?? '$'
}
