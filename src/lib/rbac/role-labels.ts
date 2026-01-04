import { APP_ROLES, type AppRole } from './types'

// =============================================================================
// ROLE UI LABELS
// =============================================================================

/**
 * Human-readable labels for roles (Spanish)
 */
export const ROLE_LABELS: Record<AppRole, string> = {
  [APP_ROLES.SUPER_ADMIN]: 'Super Admin',
  [APP_ROLES.ADMIN]: 'Administrador',
  [APP_ROLES.ASSISTANT]: 'Asistente',
  [APP_ROLES.TRAINER]: 'Entrenador',
  [APP_ROLES.NUTRITIONIST]: 'Nutricionista',
  [APP_ROLES.CLIENT]: 'Cliente',
}

/**
 * Role descriptions for UI
 */
export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  [APP_ROLES.SUPER_ADMIN]: 'Acceso completo a todas las organizaciones',
  [APP_ROLES.ADMIN]: 'Acceso completo a la organizacion',
  [APP_ROLES.ASSISTANT]: 'Puede gestionar miembros, clases y ejercicios',
  [APP_ROLES.TRAINER]: 'Puede crear rutinas y ver metricas de miembros',
  [APP_ROLES.NUTRITIONIST]: 'Puede gestionar planes nutricionales y metricas',
  [APP_ROLES.CLIENT]: 'Solo puede ver su propio perfil y rutinas',
}

/**
 * Roles that admins can assign (excluding super_admin)
 */
export const ASSIGNABLE_ROLES: AppRole[] = [
  APP_ROLES.ADMIN,
  APP_ROLES.ASSISTANT,
  APP_ROLES.TRAINER,
  APP_ROLES.NUTRITIONIST,
  APP_ROLES.CLIENT,
]

/**
 * Role badge colors for UI
 */
export const ROLE_COLORS: Record<AppRole, string> = {
  super_admin: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-red-100 text-red-800 border-red-200',
  assistant: 'bg-orange-100 text-orange-800 border-orange-200',
  trainer: 'bg-blue-100 text-blue-800 border-blue-200',
  nutritionist: 'bg-green-100 text-green-800 border-green-200',
  client: 'bg-gray-100 text-gray-800 border-gray-200',
}
