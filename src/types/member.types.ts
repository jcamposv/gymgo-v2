import type { Tables } from './database.types'

// =============================================================================
// ENUMS
// =============================================================================

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced'

export type FitnessGoal =
  | 'lose_weight'
  | 'gain_muscle'
  | 'maintain'
  | 'improve_endurance'
  | 'flexibility'
  | 'general_fitness'

export type MembershipTier = 'basic' | 'blue' | 'gold' | 'premium' | 'vip'

export type NoteType = 'notes' | 'trainer_comments' | 'progress' | 'medical' | 'general'

export type AppointmentStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled'

// =============================================================================
// MEMBER (Extended from database)
// =============================================================================

export interface MemberExtended extends Tables<'members'> {
  // Computed fields (not in DB)
  age?: number
  client_id?: number

  // Membership info (not in DB)
  membership_tier?: MembershipTier
  gym_name?: string

  // Relations
  current_plan?: Tables<'membership_plans'> | null
  measurements?: MemberMeasurement[]
  notes?: MemberNote[]
  reports?: MemberReport[]
  appointments?: MemberAppointment[]
}

// =============================================================================
// MEMBER MEASUREMENT
// =============================================================================

export interface MemberMeasurement {
  id: string
  member_id: string
  organization_id: string
  measured_at: string

  // Body measurements
  body_height_ft?: number | null
  body_height_in?: number | null
  body_height_cm?: number | null
  body_weight_lbs?: number | null
  body_weight_kg?: number | null
  body_mass_index?: number | null

  // Vital signs
  heart_rate_bpm?: number | null
  blood_pressure_systolic?: number | null
  blood_pressure_diastolic?: number | null
  respiratory_rate?: number | null

  // Blood work
  cholesterol_mg_dl?: number | null
  blood_sugar_mg_dl?: number | null
  hemoglobin_g_dl?: number | null

  // Additional measurements
  body_fat_percentage?: number | null
  muscle_mass_kg?: number | null
  waist_cm?: number | null
  hip_cm?: number | null
  chest_cm?: number | null
  arm_cm?: number | null
  thigh_cm?: number | null

  notes?: string | null
  created_at: string
  updated_at: string
}

export type MemberMeasurementInsert = Omit<MemberMeasurement, 'id' | 'created_at' | 'updated_at'>

// =============================================================================
// MEMBER NOTE
// =============================================================================

export interface MemberNote {
  id: string
  member_id: string
  organization_id: string
  type: NoteType
  title: string
  content: string
  created_by_id?: string | null
  created_by_name?: string | null
  created_at: string
  updated_at: string
}

export type MemberNoteInsert = Omit<MemberNote, 'id' | 'created_at' | 'updated_at'>

// =============================================================================
// MEMBER REPORT (Files/Documents)
// =============================================================================

export interface MemberReport {
  id: string
  member_id: string
  organization_id: string
  title: string
  file_url: string
  file_type: string
  file_size_bytes: number
  uploaded_by_id?: string | null
  uploaded_by_name?: string | null
  created_at: string
}

export type MemberReportInsert = Omit<MemberReport, 'id' | 'created_at'>

// =============================================================================
// MEMBER APPOINTMENT
// =============================================================================

export interface MemberAppointment {
  id: string
  member_id: string
  organization_id: string
  class_id?: string | null
  booking_id?: string | null

  // Display fields
  class_name: string
  trainer_name: string
  scheduled_at: string
  duration_minutes: number
  status: AppointmentStatus

  // Location
  location?: string | null

  created_at: string
  updated_at: string
}

// =============================================================================
// MEMBER DETAIL VIEW DATA
// =============================================================================

export interface MemberDetailData {
  member: MemberExtended
  latestMeasurement: MemberMeasurement | null
  notes: MemberNote[]
  reports: MemberReport[]
  upcomingAppointments: MemberAppointment[]
  pastAppointments: MemberAppointment[]
}

// =============================================================================
// FORM SCHEMAS
// =============================================================================

export interface MemberFormData {
  // Basic info
  full_name: string
  email: string
  phone?: string
  date_of_birth?: string
  gender?: string

  // Address
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string

  // Emergency contact
  emergency_contact_name?: string
  emergency_contact_relation?: string
  emergency_contact_phone?: string

  // Fitness
  experience_level: FitnessLevel
  fitness_goals?: FitnessGoal[]

  // Medical
  medical_conditions?: string
  injuries?: string

  // Membership
  current_plan_id?: string
  membership_start_date?: string
  membership_end_date?: string

  // Notes
  internal_notes?: string
}

// =============================================================================
// MEASUREMENT FORM DATA (Simplified for Fitness Tracking)
// =============================================================================

/**
 * Input data for creating/updating a measurement.
 * Focused on fitness metrics - BMI is calculated automatically.
 */
export interface MeasurementFormData {
  measured_at: string

  // Core body measurements (metric as base)
  height_cm?: number
  weight_kg?: number

  // Body composition
  body_fat_percentage?: number
  muscle_mass_kg?: number

  // Circumference measurements
  waist_cm?: number
  hip_cm?: number

  // Optional notes
  notes?: string
}

/**
 * Measurement data with calculated fields for display.
 * Used by components that need to show BMI.
 */
export interface MeasurementWithBMI extends MemberMeasurement {
  bmi: number | null
}
