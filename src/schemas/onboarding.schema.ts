import { z } from 'zod'
import type { Database } from '@/types/database.types'

type BusinessType = Database['public']['Enums']['business_type']

// =============================================================================
// STEP 1: ORGANIZATION BASIC INFO
// =============================================================================

export const organizationBasicSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(2, 'Minimo 2 caracteres')
    .max(100, 'Maximo 100 caracteres'),
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .min(3, 'Minimo 3 caracteres')
    .max(50, 'Maximo 50 caracteres')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Solo letras minusculas, numeros y guiones. Ej: mi-gimnasio'
    ),
})

// =============================================================================
// STEP 2: BUSINESS TYPE
// =============================================================================

const businessTypes = [
  'traditional_gym',
  'crossfit_box',
  'yoga_pilates_studio',
  'hiit_functional',
  'martial_arts',
  'cycling_studio',
  'personal_training',
  'wellness_spa',
  'multi_format',
] as const

export const businessTypeSchema = z.object({
  business_type: z.enum(businessTypes, {
    message: 'Selecciona el tipo de negocio',
  }),
})

// =============================================================================
// STEP 3: LOCATION & SETTINGS
// =============================================================================

export const organizationSettingsSchema = z.object({
  country: z
    .string()
    .min(1, 'El pais es requerido'),
  currency: z
    .string()
    .min(1, 'La moneda es requerida'),
  timezone: z
    .string()
    .min(1, 'La zona horaria es requerida'),
  language: z
    .string()
    .min(1, 'El idioma es requerido'),
})

// =============================================================================
// STEP 4: BRANDING (OPTIONAL)
// =============================================================================

export const organizationBrandingSchema = z.object({
  primary_color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color invalido'),
  secondary_color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color invalido'),
})

// =============================================================================
// COMPLETE ONBOARDING SCHEMA
// =============================================================================

export const onboardingSchema = organizationBasicSchema
  .merge(businessTypeSchema)
  .merge(organizationSettingsSchema)
  .merge(organizationBrandingSchema)

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type OrganizationBasicData = z.infer<typeof organizationBasicSchema>
export type BusinessTypeData = z.infer<typeof businessTypeSchema>
export type OrganizationSettingsData = z.infer<typeof organizationSettingsSchema>
export type OrganizationBrandingData = z.infer<typeof organizationBrandingSchema>
export type OnboardingData = z.infer<typeof onboardingSchema>

// =============================================================================
// BUSINESS TYPE OPTIONS (for UI)
// =============================================================================

export const BUSINESS_TYPE_OPTIONS: Array<{
  value: BusinessType
  label: string
  description: string
  icon: string
}> = [
  {
    value: 'traditional_gym',
    label: 'Gimnasio Tradicional',
    description: 'Membresías mensuales, acceso libre, rutinas personalizadas',
    icon: 'dumbbell',
  },
  {
    value: 'crossfit_box',
    label: 'CrossFit Box',
    description: 'WODs, benchmark workouts, leaderboards, PRs',
    icon: 'flame',
  },
  {
    value: 'yoga_pilates_studio',
    label: 'Estudio Yoga/Pilates',
    description: 'Reservas por clase, paquetes, multiples instructores',
    icon: 'heart',
  },
  {
    value: 'hiit_functional',
    label: 'HIIT/Funcional',
    description: 'Clases con cupo limitado, circuitos, intervalos',
    icon: 'timer',
  },
  {
    value: 'martial_arts',
    label: 'Artes Marciales',
    description: 'Sistema de grados/cinturones, torneos, clases especializadas',
    icon: 'sword',
  },
  {
    value: 'cycling_studio',
    label: 'Estudio Cycling',
    description: 'Reserva de bici especifica, metricas de rendimiento',
    icon: 'bike',
  },
  {
    value: 'personal_training',
    label: 'Entrenamiento Personal',
    description: 'Gestion de clientes, programas individuales, agenda',
    icon: 'user',
  },
  {
    value: 'wellness_spa',
    label: 'Wellness/Spa',
    description: 'Servicios adicionales, productos, citas multiples',
    icon: 'sparkles',
  },
  {
    value: 'multi_format',
    label: 'Multi-formato',
    description: 'Combina varios tipos de servicios fitness',
    icon: 'layers',
  },
]

// =============================================================================
// COUNTRY & CURRENCY OPTIONS (LATAM focus)
// =============================================================================

export const COUNTRY_OPTIONS = [
  // Norteamérica
  { value: 'MX', label: 'México', currency: 'MXN', timezone: 'America/Mexico_City' },
  { value: 'US', label: 'Estados Unidos', currency: 'USD', timezone: 'America/New_York' },

  // Centroamérica
  { value: 'CR', label: 'Costa Rica', currency: 'CRC', timezone: 'America/Costa_Rica' },
  { value: 'GT', label: 'Guatemala', currency: 'GTQ', timezone: 'America/Guatemala' },
  { value: 'PA', label: 'Panamá', currency: 'USD', timezone: 'America/Panama' },
  { value: 'HN', label: 'Honduras', currency: 'HNL', timezone: 'America/Tegucigalpa' },
  { value: 'SV', label: 'El Salvador', currency: 'USD', timezone: 'America/El_Salvador' },
  { value: 'NI', label: 'Nicaragua', currency: 'NIO', timezone: 'America/Managua' },
  { value: 'BZ', label: 'Belice', currency: 'BZD', timezone: 'America/Belize' },

  // Caribe
  { value: 'DO', label: 'República Dominicana', currency: 'DOP', timezone: 'America/Santo_Domingo' },
  { value: 'PR', label: 'Puerto Rico', currency: 'USD', timezone: 'America/Puerto_Rico' },

  // Sudamérica
  { value: 'CO', label: 'Colombia', currency: 'COP', timezone: 'America/Bogota' },
  { value: 'AR', label: 'Argentina', currency: 'ARS', timezone: 'America/Argentina/Buenos_Aires' },
  { value: 'CL', label: 'Chile', currency: 'CLP', timezone: 'America/Santiago' },
  { value: 'PE', label: 'Perú', currency: 'PEN', timezone: 'America/Lima' },
  { value: 'EC', label: 'Ecuador', currency: 'USD', timezone: 'America/Guayaquil' },
  { value: 'BR', label: 'Brasil', currency: 'BRL', timezone: 'America/Sao_Paulo' },
  { value: 'BO', label: 'Bolivia', currency: 'BOB', timezone: 'America/La_Paz' },
  { value: 'PY', label: 'Paraguay', currency: 'PYG', timezone: 'America/Asuncion' },
  { value: 'UY', label: 'Uruguay', currency: 'UYU', timezone: 'America/Montevideo' },
  { value: 'VE', label: 'Venezuela', currency: 'USD', timezone: 'America/Caracas' },

  // Europa
  { value: 'ES', label: 'España', currency: 'EUR', timezone: 'Europe/Madrid' },
] as const

export const CURRENCY_OPTIONS = [
  // Norteamérica
  { value: 'MXN', label: 'Peso Mexicano (MXN)', symbol: '$', locale: 'es-MX' },
  { value: 'USD', label: 'Dólar (USD)', symbol: '$', locale: 'en-US' },

  // Centroamérica
  { value: 'CRC', label: 'Colón Costarricense (CRC)', symbol: '₡', locale: 'es-CR' },
  { value: 'GTQ', label: 'Quetzal (GTQ)', symbol: 'Q', locale: 'es-GT' },
  { value: 'HNL', label: 'Lempira (HNL)', symbol: 'L', locale: 'es-HN' },
  { value: 'NIO', label: 'Córdoba (NIO)', symbol: 'C$', locale: 'es-NI' },
  { value: 'BZD', label: 'Dólar Beliceño (BZD)', symbol: 'BZ$', locale: 'en-BZ' },

  // Caribe
  { value: 'DOP', label: 'Peso Dominicano (DOP)', symbol: 'RD$', locale: 'es-DO' },

  // Sudamérica
  { value: 'COP', label: 'Peso Colombiano (COP)', symbol: '$', locale: 'es-CO' },
  { value: 'ARS', label: 'Peso Argentino (ARS)', symbol: '$', locale: 'es-AR' },
  { value: 'CLP', label: 'Peso Chileno (CLP)', symbol: '$', locale: 'es-CL' },
  { value: 'PEN', label: 'Sol Peruano (PEN)', symbol: 'S/', locale: 'es-PE' },
  { value: 'BRL', label: 'Real Brasileño (BRL)', symbol: 'R$', locale: 'pt-BR' },
  { value: 'BOB', label: 'Boliviano (BOB)', symbol: 'Bs', locale: 'es-BO' },
  { value: 'PYG', label: 'Guaraní (PYG)', symbol: '₲', locale: 'es-PY' },
  { value: 'UYU', label: 'Peso Uruguayo (UYU)', symbol: '$U', locale: 'es-UY' },

  // Europa
  { value: 'EUR', label: 'Euro (EUR)', symbol: '€', locale: 'es-ES' },
] as const

// Type helpers
export type CountryCode = (typeof COUNTRY_OPTIONS)[number]['value']
export type CurrencyCode = (typeof CURRENCY_OPTIONS)[number]['value']
