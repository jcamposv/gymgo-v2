import { z } from 'zod'

// =============================================================================
// LOGIN SCHEMA
// =============================================================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electronico es obligatorio')
    .email('Ingresa un correo electronico valido'),
  password: z
    .string()
    .min(1, 'La contrasena es obligatoria')
    .min(8, 'La contrasena debe tener al menos 8 caracteres'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// =============================================================================
// REGISTER SCHEMA
// =============================================================================

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede tener mas de 50 caracteres'),
  email: z
    .string()
    .min(1, 'El correo electronico es obligatorio')
    .email('Ingresa un correo electronico valido'),
  password: z
    .string()
    .min(1, 'La contrasena es obligatoria')
    .min(8, 'La contrasena debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una mayuscula')
    .regex(/[a-z]/, 'Debe incluir al menos una minuscula')
    .regex(/[0-9]/, 'Debe incluir al menos un numero'),
  confirmPassword: z
    .string()
    .min(1, 'Confirma tu contrasena'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contrasenas no coinciden',
  path: ['confirmPassword'],
})

export type RegisterFormData = z.infer<typeof registerSchema>

// =============================================================================
// FORGOT PASSWORD SCHEMA
// =============================================================================

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electronico es obligatorio')
    .email('Ingresa un correo electronico valido'),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

// =============================================================================
// RESET PASSWORD SCHEMA
// =============================================================================

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(1, 'La contrasena es obligatoria')
    .min(8, 'La contrasena debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una mayuscula')
    .regex(/[a-z]/, 'Debe incluir al menos una minuscula')
    .regex(/[0-9]/, 'Debe incluir al menos un numero'),
  confirmPassword: z
    .string()
    .min(1, 'Confirma tu contrasena'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contrasenas no coinciden',
  path: ['confirmPassword'],
})

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
