// =============================================================================
// RBAC TYPES - Role-Based Access Control
// =============================================================================

/**
 * Application roles
 *
 * SUPER_ADMIN: Platform-level admin (manages multiple organizations)
 * ADMIN: Organization owner/admin (full access to their gym)
 * ASSISTANT: Staff with most admin permissions except finances/critical settings
 * TRAINER: Can manage workouts, metrics for members
 * NUTRITIONIST: Can manage nutrition plans, metrics for members
 * CLIENT: Gym member with access only to their own data
 */
export const APP_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  ASSISTANT: 'assistant',
  TRAINER: 'trainer',
  NUTRITIONIST: 'nutritionist',
  CLIENT: 'client',
} as const

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES]

/**
 * All available application roles as an array
 */
export const ALL_ROLES: AppRole[] = Object.values(APP_ROLES)

/**
 * Staff roles (anyone who can manage the gym in some capacity)
 */
export const STAFF_ROLES: AppRole[] = [
  APP_ROLES.SUPER_ADMIN,
  APP_ROLES.ADMIN,
  APP_ROLES.ASSISTANT,
  APP_ROLES.TRAINER,
  APP_ROLES.NUTRITIONIST,
]

/**
 * Admin-level roles (full dashboard access)
 */
export const ADMIN_ROLES: AppRole[] = [
  APP_ROLES.SUPER_ADMIN,
  APP_ROLES.ADMIN,
]

// =============================================================================
// PERMISSIONS
// =============================================================================

/**
 * Application permissions
 *
 * Naming convention:
 * - view_*: Read-only access
 * - manage_*: Full CRUD access
 * - edit_*: Update only (no create/delete)
 * - *_own_*: Access to own data only
 * - *_any_*: Access to any user's data
 */
export const PERMISSIONS = {
  // Dashboard access
  VIEW_ADMIN_DASHBOARD: 'view_admin_dashboard',
  VIEW_CLIENT_DASHBOARD: 'view_client_dashboard',
  VIEW_TRAINER_DASHBOARD: 'view_trainer_dashboard',

  // Gym settings & configuration
  MANAGE_GYM_SETTINGS: 'manage_gym_settings',
  MANAGE_GYM_BRANDING: 'manage_gym_branding',

  // Financial
  VIEW_GYM_FINANCES: 'view_gym_finances',
  MANAGE_GYM_FINANCES: 'manage_gym_finances',
  VIEW_REPORTS: 'view_reports',

  // Membership plans
  VIEW_PLANS: 'view_plans',
  MANAGE_PLANS: 'manage_plans',

  // Members management
  VIEW_MEMBERS: 'view_members',
  MANAGE_MEMBERS: 'manage_members',
  INVITE_MEMBERS: 'invite_members',
  VIEW_ANY_MEMBER_PROFILE: 'view_any_member_profile',

  // Classes
  VIEW_CLASSES: 'view_classes',
  MANAGE_CLASSES: 'manage_classes',
  MANAGE_CLASS_TEMPLATES: 'manage_class_templates',

  // Exercises & Routines (for all members)
  VIEW_EXERCISES: 'view_exercises',
  MANAGE_EXERCISES: 'manage_exercises',
  VIEW_ANY_MEMBER_ROUTINES: 'view_any_member_routines',
  MANAGE_ANY_MEMBER_ROUTINES: 'manage_any_member_routines',
  ASSIGN_ROUTINES: 'assign_routines',

  // Metrics & Measurements (for all members)
  VIEW_ANY_MEMBER_METRICS: 'view_any_member_metrics',
  MANAGE_ANY_MEMBER_METRICS: 'manage_any_member_metrics',

  // Notes (trainer/nutritionist notes on members)
  VIEW_ANY_MEMBER_NOTES: 'view_any_member_notes',
  MANAGE_ANY_MEMBER_NOTES: 'manage_any_member_notes',

  // Reports (fitness reports, PDFs, etc.)
  VIEW_ANY_MEMBER_REPORTS: 'view_any_member_reports',
  MANAGE_ANY_MEMBER_REPORTS: 'manage_any_member_reports',

  // Check-in system
  VIEW_CHECK_INS: 'view_check_ins',
  MANAGE_CHECK_INS: 'manage_check_ins',
  PERFORM_CHECK_IN: 'perform_check_in',

  // Bookings
  VIEW_ANY_BOOKINGS: 'view_any_bookings',
  MANAGE_ANY_BOOKINGS: 'manage_any_bookings',

  // OWN DATA - For clients and staff who are also gym members
  VIEW_OWN_MEMBER_PROFILE: 'view_own_member_profile',
  EDIT_OWN_MEMBER_PROFILE: 'edit_own_member_profile',
  VIEW_OWN_ROUTINES: 'view_own_routines',
  VIEW_OWN_METRICS: 'view_own_metrics',
  VIEW_OWN_REPORTS: 'view_own_reports',
  VIEW_OWN_BOOKINGS: 'view_own_bookings',
  MANAGE_OWN_BOOKINGS: 'manage_own_bookings',

  // User management (staff)
  VIEW_STAFF: 'view_staff',
  MANAGE_STAFF: 'manage_staff',

  // Platform admin (SUPER_ADMIN only)
  VIEW_ALL_ORGANIZATIONS: 'view_all_organizations',
  MANAGE_ALL_ORGANIZATIONS: 'manage_all_organizations',
} as const

export type AppPermission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/**
 * All available permissions as an array
 */
export const ALL_PERMISSIONS: AppPermission[] = Object.values(PERMISSIONS)

// =============================================================================
// USER WITH ROLE
// =============================================================================

/**
 * Minimal user type with role information
 * Used by permission helpers
 */
export interface UserWithRole {
  id: string
  role: AppRole
  organization_id: string | null
}

/**
 * Member profile associated with a user
 * Any user (regardless of role) can have a member profile
 */
export interface MemberProfile {
  id: string
  full_name: string
  email: string
  status: string
  current_plan_id: string | null
  membership_status: string
}

/**
 * Full user context including role and optional member profile
 */
export interface UserContext extends UserWithRole {
  email: string
  full_name: string | null
  avatar_url: string | null
  member_profile: MemberProfile | null
}
