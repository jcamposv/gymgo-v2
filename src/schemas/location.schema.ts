import { z } from 'zod'

// =============================================================================
// Location Schema - Validaciones para sucursales
// =============================================================================

/**
 * Schema para crear una nueva ubicación/sucursal
 */
export const locationCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),

  slug: z
    .string()
    .min(1, 'El identificador es obligatorio')
    .min(2, 'El identificador debe tener al menos 2 caracteres')
    .max(50, 'El identificador no puede exceder 50 caracteres')
    .regex(
      /^[a-z0-9-]+$/,
      'El identificador solo puede contener letras minúsculas, números y guiones'
    ),

  description: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .or(z.literal('')),

  // Address
  address_line1: z
    .string()
    .max(200, 'La dirección no puede exceder 200 caracteres')
    .optional()
    .or(z.literal('')),

  address_line2: z
    .string()
    .max(200, 'La dirección no puede exceder 200 caracteres')
    .optional()
    .or(z.literal('')),

  city: z
    .string()
    .max(100, 'La ciudad no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),

  state: z
    .string()
    .max(100, 'El estado no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),

  postal_code: z
    .string()
    .max(20, 'El código postal no puede exceder 20 caracteres')
    .optional()
    .or(z.literal('')),

  country: z
    .string()
    .max(100, 'El país no puede exceder 100 caracteres')
    .default('MX'),

  // Contact
  phone: z
    .string()
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .optional()
    .or(z.literal('')),

  email: z
    .string()
    .email('Ingresa un correo electrónico válido')
    .optional()
    .or(z.literal('')),
})

/**
 * Schema para actualizar una ubicación existente
 */
export const locationUpdateSchema = locationCreateSchema.partial().extend({
  is_active: z.boolean().optional(),
})

/**
 * Schema para cambiar la ubicación principal
 */
export const setPrimaryLocationSchema = z.object({
  location_id: z.string().uuid('ID de ubicación inválido'),
})

// =============================================================================
// TYPES
// =============================================================================

export type LocationCreateFormData = z.infer<typeof locationCreateSchema>
export type LocationUpdateFormData = z.infer<typeof locationUpdateSchema>
export type SetPrimaryLocationData = z.infer<typeof setPrimaryLocationSchema>

// =============================================================================
// LOCATION TYPE (from database)
// =============================================================================

export interface Location {
  id: string
  organization_id: string
  name: string
  slug: string
  description: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  phone: string | null
  email: string | null
  is_primary: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// =============================================================================
// HELPER: Generate slug from name
// =============================================================================

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50) // Limit length
}
