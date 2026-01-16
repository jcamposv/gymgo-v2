// Database types
export type { Database, Json, Tables, TablesInsert, TablesUpdate, Enums } from './database.types'
export { Constants } from './database.types'

// Derived enum types from Database
import type { Database } from './database.types'
export type BusinessType = Database['public']['Enums']['business_type']
export type SubscriptionPlan = Database['public']['Enums']['subscription_plan']
export type BookingStatus = Database['public']['Enums']['booking_status']
export type UserRole = Database['public']['Enums']['user_role']
export type PaymentStatus = Database['public']['Enums']['payment_status']
export type MemberStatus = 'active' | 'inactive' | 'pending' | 'suspended'
export type MembershipStatus = 'active' | 'expired' | 'cancelled' | 'pending'

// Supabase shorthand types
export * from './supabase'

// API types
export * from './api.types'
