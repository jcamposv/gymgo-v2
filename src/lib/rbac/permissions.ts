import { APP_ROLES, PERMISSIONS, type AppRole, type AppPermission } from './types'

// =============================================================================
// ROLE -> PERMISSIONS MAPPING
// =============================================================================

/**
 * Centralized mapping of roles to their permissions
 *
 * To add a new permission:
 * 1. Add it to PERMISSIONS in types.ts
 * 2. Add it to the appropriate role(s) below
 *
 * To add a new role:
 * 1. Add it to APP_ROLES in types.ts
 * 2. Add its permission array below
 */
export const ROLE_PERMISSIONS: Record<AppRole, AppPermission[]> = {
  // ---------------------------------------------------------------------------
  // SUPER_ADMIN - Platform administrator
  // ---------------------------------------------------------------------------
  [APP_ROLES.SUPER_ADMIN]: [
    // All permissions
    ...Object.values(PERMISSIONS),
  ],

  // ---------------------------------------------------------------------------
  // ADMIN - Gym owner/administrator
  // ---------------------------------------------------------------------------
  [APP_ROLES.ADMIN]: [
    // Dashboard
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,
    PERMISSIONS.VIEW_CLIENT_DASHBOARD,
    PERMISSIONS.VIEW_TRAINER_DASHBOARD,

    // Gym management
    PERMISSIONS.MANAGE_GYM_SETTINGS,
    PERMISSIONS.MANAGE_GYM_BRANDING,

    // Finances
    PERMISSIONS.VIEW_GYM_FINANCES,
    PERMISSIONS.MANAGE_GYM_FINANCES,
    PERMISSIONS.VIEW_REPORTS,

    // Plans
    PERMISSIONS.VIEW_PLANS,
    PERMISSIONS.MANAGE_PLANS,

    // Members
    PERMISSIONS.VIEW_MEMBERS,
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.INVITE_MEMBERS,
    PERMISSIONS.VIEW_ANY_MEMBER_PROFILE,

    // Classes
    PERMISSIONS.VIEW_CLASSES,
    PERMISSIONS.MANAGE_CLASSES,
    PERMISSIONS.MANAGE_CLASS_TEMPLATES,

    // Exercises & Routines
    PERMISSIONS.VIEW_EXERCISES,
    PERMISSIONS.MANAGE_EXERCISES,
    PERMISSIONS.VIEW_ANY_MEMBER_ROUTINES,
    PERMISSIONS.MANAGE_ANY_MEMBER_ROUTINES,
    PERMISSIONS.ASSIGN_ROUTINES,

    // Metrics
    PERMISSIONS.VIEW_ANY_MEMBER_METRICS,
    PERMISSIONS.MANAGE_ANY_MEMBER_METRICS,

    // Notes
    PERMISSIONS.VIEW_ANY_MEMBER_NOTES,
    PERMISSIONS.MANAGE_ANY_MEMBER_NOTES,

    // Reports
    PERMISSIONS.VIEW_ANY_MEMBER_REPORTS,
    PERMISSIONS.MANAGE_ANY_MEMBER_REPORTS,

    // Check-in
    PERMISSIONS.VIEW_CHECK_INS,
    PERMISSIONS.MANAGE_CHECK_INS,
    PERMISSIONS.PERFORM_CHECK_IN,

    // Bookings
    PERMISSIONS.VIEW_ANY_BOOKINGS,
    PERMISSIONS.MANAGE_ANY_BOOKINGS,

    // Own data (admin can also be a gym member)
    PERMISSIONS.VIEW_OWN_MEMBER_PROFILE,
    PERMISSIONS.EDIT_OWN_MEMBER_PROFILE,
    PERMISSIONS.VIEW_OWN_ROUTINES,
    PERMISSIONS.VIEW_OWN_METRICS,
    PERMISSIONS.VIEW_OWN_REPORTS,
    PERMISSIONS.VIEW_OWN_BOOKINGS,
    PERMISSIONS.MANAGE_OWN_BOOKINGS,

    // Staff management
    PERMISSIONS.VIEW_STAFF,
    PERMISSIONS.MANAGE_STAFF,
  ],

  // ---------------------------------------------------------------------------
  // ASSISTANT - Staff with most permissions except finances/critical settings
  // ---------------------------------------------------------------------------
  [APP_ROLES.ASSISTANT]: [
    // Dashboard
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,
    PERMISSIONS.VIEW_CLIENT_DASHBOARD,
    PERMISSIONS.VIEW_TRAINER_DASHBOARD,

    // NO gym settings/branding
    // NO finances

    // Reports (read-only)
    PERMISSIONS.VIEW_REPORTS,

    // Plans (read-only)
    PERMISSIONS.VIEW_PLANS,

    // Members
    PERMISSIONS.VIEW_MEMBERS,
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.INVITE_MEMBERS,
    PERMISSIONS.VIEW_ANY_MEMBER_PROFILE,

    // Classes
    PERMISSIONS.VIEW_CLASSES,
    PERMISSIONS.MANAGE_CLASSES,
    PERMISSIONS.MANAGE_CLASS_TEMPLATES,

    // Exercises & Routines
    PERMISSIONS.VIEW_EXERCISES,
    PERMISSIONS.MANAGE_EXERCISES,
    PERMISSIONS.VIEW_ANY_MEMBER_ROUTINES,
    PERMISSIONS.MANAGE_ANY_MEMBER_ROUTINES,
    PERMISSIONS.ASSIGN_ROUTINES,

    // Metrics
    PERMISSIONS.VIEW_ANY_MEMBER_METRICS,
    PERMISSIONS.MANAGE_ANY_MEMBER_METRICS,

    // Notes
    PERMISSIONS.VIEW_ANY_MEMBER_NOTES,
    PERMISSIONS.MANAGE_ANY_MEMBER_NOTES,

    // Reports
    PERMISSIONS.VIEW_ANY_MEMBER_REPORTS,
    PERMISSIONS.MANAGE_ANY_MEMBER_REPORTS,

    // Check-in
    PERMISSIONS.VIEW_CHECK_INS,
    PERMISSIONS.MANAGE_CHECK_INS,
    PERMISSIONS.PERFORM_CHECK_IN,

    // Bookings
    PERMISSIONS.VIEW_ANY_BOOKINGS,
    PERMISSIONS.MANAGE_ANY_BOOKINGS,

    // Own data
    PERMISSIONS.VIEW_OWN_MEMBER_PROFILE,
    PERMISSIONS.EDIT_OWN_MEMBER_PROFILE,
    PERMISSIONS.VIEW_OWN_ROUTINES,
    PERMISSIONS.VIEW_OWN_METRICS,
    PERMISSIONS.VIEW_OWN_REPORTS,
    PERMISSIONS.VIEW_OWN_BOOKINGS,
    PERMISSIONS.MANAGE_OWN_BOOKINGS,

    // Staff (view only)
    PERMISSIONS.VIEW_STAFF,
  ],

  // ---------------------------------------------------------------------------
  // TRAINER - Can manage workouts, metrics for members
  // ---------------------------------------------------------------------------
  [APP_ROLES.TRAINER]: [
    // Dashboard - TRAINER needs access to admin dashboard to manage members/routines
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,
    PERMISSIONS.VIEW_TRAINER_DASHBOARD,
    PERMISSIONS.VIEW_CLIENT_DASHBOARD,

    // NO gym settings
    // NO finances
    // NO plans management

    // Members (view only)
    PERMISSIONS.VIEW_MEMBERS,
    PERMISSIONS.VIEW_ANY_MEMBER_PROFILE,

    // Classes (view + manage their own)
    PERMISSIONS.VIEW_CLASSES,
    PERMISSIONS.MANAGE_CLASSES,

    // Exercises & Routines (full access)
    PERMISSIONS.VIEW_EXERCISES,
    PERMISSIONS.MANAGE_EXERCISES,
    PERMISSIONS.VIEW_ANY_MEMBER_ROUTINES,
    PERMISSIONS.MANAGE_ANY_MEMBER_ROUTINES,
    PERMISSIONS.ASSIGN_ROUTINES,

    // Metrics (view + manage)
    PERMISSIONS.VIEW_ANY_MEMBER_METRICS,
    PERMISSIONS.MANAGE_ANY_MEMBER_METRICS,

    // Notes (view + manage)
    PERMISSIONS.VIEW_ANY_MEMBER_NOTES,
    PERMISSIONS.MANAGE_ANY_MEMBER_NOTES,

    // Reports (view only)
    PERMISSIONS.VIEW_ANY_MEMBER_REPORTS,

    // Check-in (perform only)
    PERMISSIONS.PERFORM_CHECK_IN,

    // Own data
    PERMISSIONS.VIEW_OWN_MEMBER_PROFILE,
    PERMISSIONS.EDIT_OWN_MEMBER_PROFILE,
    PERMISSIONS.VIEW_OWN_ROUTINES,
    PERMISSIONS.VIEW_OWN_METRICS,
    PERMISSIONS.VIEW_OWN_REPORTS,
    PERMISSIONS.VIEW_OWN_BOOKINGS,
    PERMISSIONS.MANAGE_OWN_BOOKINGS,
  ],

  // ---------------------------------------------------------------------------
  // NUTRITIONIST - Can manage nutrition plans, metrics for members
  // ---------------------------------------------------------------------------
  [APP_ROLES.NUTRITIONIST]: [
    // Dashboard - NUTRITIONIST needs access to admin dashboard to manage metrics/nutrition
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,
    PERMISSIONS.VIEW_TRAINER_DASHBOARD,
    PERMISSIONS.VIEW_CLIENT_DASHBOARD,

    // NO gym settings
    // NO finances
    // NO plans management

    // Members (view only)
    PERMISSIONS.VIEW_MEMBERS,
    PERMISSIONS.VIEW_ANY_MEMBER_PROFILE,

    // Classes (view only)
    PERMISSIONS.VIEW_CLASSES,

    // Exercises (view only - for context)
    PERMISSIONS.VIEW_EXERCISES,

    // Routines (view only)
    PERMISSIONS.VIEW_ANY_MEMBER_ROUTINES,

    // Metrics (full access - important for nutrition)
    PERMISSIONS.VIEW_ANY_MEMBER_METRICS,
    PERMISSIONS.MANAGE_ANY_MEMBER_METRICS,

    // Notes (full access)
    PERMISSIONS.VIEW_ANY_MEMBER_NOTES,
    PERMISSIONS.MANAGE_ANY_MEMBER_NOTES,

    // Reports (view + upload nutritional reports)
    PERMISSIONS.VIEW_ANY_MEMBER_REPORTS,
    PERMISSIONS.MANAGE_ANY_MEMBER_REPORTS,

    // Own data
    PERMISSIONS.VIEW_OWN_MEMBER_PROFILE,
    PERMISSIONS.EDIT_OWN_MEMBER_PROFILE,
    PERMISSIONS.VIEW_OWN_ROUTINES,
    PERMISSIONS.VIEW_OWN_METRICS,
    PERMISSIONS.VIEW_OWN_REPORTS,
    PERMISSIONS.VIEW_OWN_BOOKINGS,
    PERMISSIONS.MANAGE_OWN_BOOKINGS,
  ],

  // ---------------------------------------------------------------------------
  // CLIENT - Gym member with access only to their own data
  // ---------------------------------------------------------------------------
  [APP_ROLES.CLIENT]: [
    // Dashboard
    PERMISSIONS.VIEW_CLIENT_DASHBOARD,

    // NO admin access
    // NO gym settings
    // NO finances
    // NO plans management
    // NO members management

    // Classes (view for booking)
    PERMISSIONS.VIEW_CLASSES,

    // Check-in (perform their own)
    PERMISSIONS.PERFORM_CHECK_IN,

    // Own data only
    PERMISSIONS.VIEW_OWN_MEMBER_PROFILE,
    PERMISSIONS.EDIT_OWN_MEMBER_PROFILE,
    PERMISSIONS.VIEW_OWN_ROUTINES,
    PERMISSIONS.VIEW_OWN_METRICS,
    PERMISSIONS.VIEW_OWN_REPORTS,
    PERMISSIONS.VIEW_OWN_BOOKINGS,
    PERMISSIONS.MANAGE_OWN_BOOKINGS,
  ],
}

// =============================================================================
// PERMISSION GROUPS (for UI organization)
// =============================================================================

/**
 * Permission groups for easier UI display and management
 */
export const PERMISSION_GROUPS = {
  dashboard: {
    label: 'Dashboard',
    permissions: [
      PERMISSIONS.VIEW_ADMIN_DASHBOARD,
      PERMISSIONS.VIEW_CLIENT_DASHBOARD,
      PERMISSIONS.VIEW_TRAINER_DASHBOARD,
    ],
  },
  gym_management: {
    label: 'Gestión del Gym',
    permissions: [
      PERMISSIONS.MANAGE_GYM_SETTINGS,
      PERMISSIONS.MANAGE_GYM_BRANDING,
    ],
  },
  finances: {
    label: 'Finanzas',
    permissions: [
      PERMISSIONS.VIEW_GYM_FINANCES,
      PERMISSIONS.MANAGE_GYM_FINANCES,
      PERMISSIONS.VIEW_REPORTS,
    ],
  },
  plans: {
    label: 'Planes de Membresía',
    permissions: [
      PERMISSIONS.VIEW_PLANS,
      PERMISSIONS.MANAGE_PLANS,
    ],
  },
  members: {
    label: 'Miembros',
    permissions: [
      PERMISSIONS.VIEW_MEMBERS,
      PERMISSIONS.MANAGE_MEMBERS,
      PERMISSIONS.INVITE_MEMBERS,
      PERMISSIONS.VIEW_ANY_MEMBER_PROFILE,
    ],
  },
  classes: {
    label: 'Clases',
    permissions: [
      PERMISSIONS.VIEW_CLASSES,
      PERMISSIONS.MANAGE_CLASSES,
      PERMISSIONS.MANAGE_CLASS_TEMPLATES,
    ],
  },
  training: {
    label: 'Entrenamiento',
    permissions: [
      PERMISSIONS.VIEW_EXERCISES,
      PERMISSIONS.MANAGE_EXERCISES,
      PERMISSIONS.VIEW_ANY_MEMBER_ROUTINES,
      PERMISSIONS.MANAGE_ANY_MEMBER_ROUTINES,
      PERMISSIONS.ASSIGN_ROUTINES,
    ],
  },
  health: {
    label: 'Salud y Métricas',
    permissions: [
      PERMISSIONS.VIEW_ANY_MEMBER_METRICS,
      PERMISSIONS.MANAGE_ANY_MEMBER_METRICS,
      PERMISSIONS.VIEW_ANY_MEMBER_NOTES,
      PERMISSIONS.MANAGE_ANY_MEMBER_NOTES,
      PERMISSIONS.VIEW_ANY_MEMBER_REPORTS,
      PERMISSIONS.MANAGE_ANY_MEMBER_REPORTS,
    ],
  },
  operations: {
    label: 'Operaciones',
    permissions: [
      PERMISSIONS.VIEW_CHECK_INS,
      PERMISSIONS.MANAGE_CHECK_INS,
      PERMISSIONS.PERFORM_CHECK_IN,
      PERMISSIONS.VIEW_ANY_BOOKINGS,
      PERMISSIONS.MANAGE_ANY_BOOKINGS,
    ],
  },
  own_data: {
    label: 'Datos Propios',
    permissions: [
      PERMISSIONS.VIEW_OWN_MEMBER_PROFILE,
      PERMISSIONS.EDIT_OWN_MEMBER_PROFILE,
      PERMISSIONS.VIEW_OWN_ROUTINES,
      PERMISSIONS.VIEW_OWN_METRICS,
      PERMISSIONS.VIEW_OWN_REPORTS,
      PERMISSIONS.VIEW_OWN_BOOKINGS,
      PERMISSIONS.MANAGE_OWN_BOOKINGS,
    ],
  },
  staff: {
    label: 'Personal',
    permissions: [
      PERMISSIONS.VIEW_STAFF,
      PERMISSIONS.MANAGE_STAFF,
    ],
  },
  platform: {
    label: 'Plataforma',
    permissions: [
      PERMISSIONS.VIEW_ALL_ORGANIZATIONS,
      PERMISSIONS.MANAGE_ALL_ORGANIZATIONS,
    ],
  },
} as const

// =============================================================================
// ROLE LABELS (for UI)
// =============================================================================

/**
 * Human-readable labels for roles (Spanish)
 */
export const ROLE_LABELS: Record<AppRole, string> = {
  [APP_ROLES.SUPER_ADMIN]: 'Super Administrador',
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
  [APP_ROLES.SUPER_ADMIN]: 'Acceso completo a la plataforma y todas las organizaciones',
  [APP_ROLES.ADMIN]: 'Acceso completo al gimnasio, incluyendo finanzas y configuración',
  [APP_ROLES.ASSISTANT]: 'Gestión operativa del gimnasio sin acceso a finanzas',
  [APP_ROLES.TRAINER]: 'Gestión de rutinas, métricas y notas de miembros',
  [APP_ROLES.NUTRITIONIST]: 'Gestión de métricas nutricionales y reportes de miembros',
  [APP_ROLES.CLIENT]: 'Acceso a sus propios datos, rutinas y progreso',
}
