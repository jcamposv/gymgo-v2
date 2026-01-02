import type {
  Tables as DbTables,
  TablesInsert,
  TablesUpdate,
} from './database.types'

// =============================================================================
// Table Row Types (shorthand)
// =============================================================================

export type Organization = DbTables<'organizations'>
export type Profile = DbTables<'profiles'>
export type MembershipPlan = DbTables<'membership_plans'>
export type Member = DbTables<'members'>
export type Class = DbTables<'classes'>
export type Booking = DbTables<'bookings'>
export type CheckIn = DbTables<'check_ins'>
export type Payment = DbTables<'payments'>
export type Exercise = DbTables<'exercises'>
export type Workout = DbTables<'workouts'>

// =============================================================================
// Insert Types (shorthand)
// =============================================================================

export type OrganizationInsert = TablesInsert<'organizations'>
export type ProfileInsert = TablesInsert<'profiles'>
export type MembershipPlanInsert = TablesInsert<'membership_plans'>
export type MemberInsert = TablesInsert<'members'>
export type ClassInsert = TablesInsert<'classes'>
export type BookingInsert = TablesInsert<'bookings'>
export type CheckInInsert = TablesInsert<'check_ins'>
export type PaymentInsert = TablesInsert<'payments'>
export type ExerciseInsert = TablesInsert<'exercises'>
export type WorkoutInsert = TablesInsert<'workouts'>

// =============================================================================
// Update Types (shorthand)
// =============================================================================

export type OrganizationUpdate = TablesUpdate<'organizations'>
export type ProfileUpdate = TablesUpdate<'profiles'>
export type MembershipPlanUpdate = TablesUpdate<'membership_plans'>
export type MemberUpdate = TablesUpdate<'members'>
export type ClassUpdate = TablesUpdate<'classes'>
export type BookingUpdate = TablesUpdate<'bookings'>
export type CheckInUpdate = TablesUpdate<'check_ins'>
export type PaymentUpdate = TablesUpdate<'payments'>
export type ExerciseUpdate = TablesUpdate<'exercises'>
export type WorkoutUpdate = TablesUpdate<'workouts'>

// =============================================================================
// Extended Types (with relations)
// =============================================================================

export type MemberWithPlan = Member & {
  current_plan: MembershipPlan | null
}

export type ClassWithInstructor = Class & {
  instructor: Profile | null
}

export type BookingWithDetails = Booking & {
  class: Class
  member: Member
}

export type WorkoutWithExercises = Workout & {
  exercise_details: Exercise[]
}
