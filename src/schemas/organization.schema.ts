import { z } from 'zod'

// =============================================================================
// Organization Schemas
// =============================================================================

export const organizationSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Minimum 2 characters')
    .max(100, 'Maximum 100 characters'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .min(3, 'Minimum 3 characters')
    .max(50, 'Maximum 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  business_type: z
    .enum([
      'traditional_gym',
      'crossfit_box',
      'yoga_pilates_studio',
      'hiit_functional',
      'martial_arts',
      'cycling_studio',
      'personal_training',
      'wellness_spa',
      'multi_format',
    ])
    .default('traditional_gym'),
  email: z
    .string()
    .email('Invalid email format')
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(20, 'Maximum 20 characters')
    .optional()
    .nullable(),
  website: z
    .string()
    .url('Invalid URL format')
    .optional()
    .nullable()
    .or(z.literal('')),
  address_line1: z
    .string()
    .max(255, 'Maximum 255 characters')
    .optional()
    .nullable(),
  address_line2: z
    .string()
    .max(255, 'Maximum 255 characters')
    .optional()
    .nullable(),
  city: z
    .string()
    .max(100, 'Maximum 100 characters')
    .optional()
    .nullable(),
  state: z
    .string()
    .max(100, 'Maximum 100 characters')
    .optional()
    .nullable(),
  postal_code: z
    .string()
    .max(20, 'Maximum 20 characters')
    .optional()
    .nullable(),
  country: z
    .string()
    .length(2, 'Must be 2-letter country code')
    .default('MX'),
  logo_url: z
    .string()
    .url('Invalid URL format')
    .optional()
    .nullable()
    .or(z.literal('')),
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be valid hex color')
    .default('#000000'),
  secondary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be valid hex color')
    .default('#ffffff'),
  language: z
    .enum(['es', 'en', 'pt'])
    .default('es'),
  currency: z
    .enum(['MXN', 'USD', 'COP', 'ARS', 'CLP', 'PEN', 'BRL'])
    .default('MXN'),
  timezone: z
    .string()
    .default('America/Mexico_City'),
})

export const organizationUpdateSchema = organizationSchema.partial()

export const organizationOnboardingSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  business_type: z.enum([
    'traditional_gym',
    'crossfit_box',
    'yoga_pilates_studio',
    'hiit_functional',
    'martial_arts',
    'cycling_studio',
    'personal_training',
    'wellness_spa',
    'multi_format',
  ]),
  country: z.string().length(2).default('MX'),
  currency: z.enum(['MXN', 'USD', 'COP', 'ARS', 'CLP', 'PEN', 'BRL']).default('MXN'),
  admin_email: z.string().email(),
  admin_name: z.string().min(2).max(100),
  admin_password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must include uppercase')
    .regex(/[a-z]/, 'Must include lowercase')
    .regex(/[0-9]/, 'Must include number'),
})

export type OrganizationFormData = z.infer<typeof organizationSchema>
export type OrganizationUpdateData = z.infer<typeof organizationUpdateSchema>
export type OrganizationOnboardingData = z.infer<typeof organizationOnboardingSchema>
