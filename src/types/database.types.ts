export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// =============================================================================
// ENUMS
// =============================================================================

export type BusinessType =
  | 'traditional_gym'
  | 'crossfit_box'
  | 'yoga_pilates_studio'
  | 'hiit_functional'
  | 'martial_arts'
  | 'cycling_studio'
  | 'personal_training'
  | 'wellness_spa'
  | 'multi_format'

export type SubscriptionPlan = 'starter' | 'growth' | 'pro' | 'enterprise'

export type MemberStatus = 'active' | 'inactive' | 'suspended' | 'cancelled'

export type MembershipStatus = 'active' | 'expired' | 'cancelled' | 'frozen'

export type BookingStatus = 'confirmed' | 'cancelled' | 'attended' | 'no_show' | 'waitlist'

export type UserRole = 'owner' | 'admin' | 'instructor' | 'member'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

// =============================================================================
// DATABASE TYPES
// =============================================================================

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.1'
  }
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          business_type: BusinessType
          email: string | null
          phone: string | null
          website: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          country: string
          logo_url: string | null
          primary_color: string
          secondary_color: string
          subscription_plan: SubscriptionPlan
          max_members: number
          max_locations: number
          max_admin_users: number
          features: Json
          language: string
          currency: string
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          business_type?: BusinessType
          email?: string | null
          phone?: string | null
          website?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          subscription_plan?: SubscriptionPlan
          max_members?: number
          max_locations?: number
          max_admin_users?: number
          features?: Json
          language?: string
          currency?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          business_type?: BusinessType
          email?: string | null
          phone?: string | null
          website?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          subscription_plan?: SubscriptionPlan
          max_members?: number
          max_locations?: number
          max_admin_users?: number
          features?: Json
          language?: string
          currency?: string
          timezone?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          organization_id: string | null
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id?: string | null
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          organization_id?: string | null
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: UserRole
          updated_at?: string
        }
      }
      membership_plans: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          price: number
          currency: string
          billing_period: string
          unlimited_access: boolean
          classes_per_period: number | null
          access_all_locations: boolean
          duration_days: number
          features: Json
          is_active: boolean
          is_featured: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          price: number
          currency?: string
          billing_period?: string
          unlimited_access?: boolean
          classes_per_period?: number | null
          access_all_locations?: boolean
          duration_days?: number
          features?: Json
          is_active?: boolean
          is_featured?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          price?: number
          currency?: string
          billing_period?: string
          unlimited_access?: boolean
          classes_per_period?: number | null
          access_all_locations?: boolean
          duration_days?: number
          features?: Json
          is_active?: boolean
          is_featured?: boolean
          sort_order?: number
          updated_at?: string
        }
      }
      members: {
        Row: {
          id: string
          organization_id: string
          profile_id: string | null
          email: string
          full_name: string
          phone: string | null
          avatar_url: string | null
          date_of_birth: string | null
          gender: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          medical_conditions: string | null
          injuries: string | null
          fitness_goals: string[] | null
          experience_level: string
          status: MemberStatus
          current_plan_id: string | null
          membership_start_date: string | null
          membership_end_date: string | null
          membership_status: MembershipStatus
          access_code: string | null
          check_in_count: number
          last_check_in: string | null
          internal_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          profile_id?: string | null
          email: string
          full_name: string
          phone?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          gender?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          medical_conditions?: string | null
          injuries?: string | null
          fitness_goals?: string[] | null
          experience_level?: string
          status?: MemberStatus
          current_plan_id?: string | null
          membership_start_date?: string | null
          membership_end_date?: string | null
          membership_status?: MembershipStatus
          access_code?: string | null
          check_in_count?: number
          last_check_in?: string | null
          internal_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          profile_id?: string | null
          email?: string
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          gender?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          medical_conditions?: string | null
          injuries?: string | null
          fitness_goals?: string[] | null
          experience_level?: string
          status?: MemberStatus
          current_plan_id?: string | null
          membership_start_date?: string | null
          membership_end_date?: string | null
          membership_status?: MembershipStatus
          access_code?: string | null
          check_in_count?: number
          last_check_in?: string | null
          internal_notes?: string | null
          updated_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          class_type: string | null
          start_time: string
          end_time: string
          duration_minutes: number
          is_recurring: boolean
          recurrence_rule: string | null
          parent_class_id: string | null
          max_capacity: number
          current_bookings: number
          waitlist_enabled: boolean
          max_waitlist: number
          instructor_id: string | null
          instructor_name: string | null
          location: string | null
          booking_opens_hours: number
          booking_closes_minutes: number
          cancellation_deadline_hours: number
          wod_details: Json | null
          is_cancelled: boolean
          cancellation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          class_type?: string | null
          start_time: string
          end_time: string
          is_recurring?: boolean
          recurrence_rule?: string | null
          parent_class_id?: string | null
          max_capacity?: number
          current_bookings?: number
          waitlist_enabled?: boolean
          max_waitlist?: number
          instructor_id?: string | null
          instructor_name?: string | null
          location?: string | null
          booking_opens_hours?: number
          booking_closes_minutes?: number
          cancellation_deadline_hours?: number
          wod_details?: Json | null
          is_cancelled?: boolean
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          class_type?: string | null
          start_time?: string
          end_time?: string
          is_recurring?: boolean
          recurrence_rule?: string | null
          parent_class_id?: string | null
          max_capacity?: number
          current_bookings?: number
          waitlist_enabled?: boolean
          max_waitlist?: number
          instructor_id?: string | null
          instructor_name?: string | null
          location?: string | null
          booking_opens_hours?: number
          booking_closes_minutes?: number
          cancellation_deadline_hours?: number
          wod_details?: Json | null
          is_cancelled?: boolean
          cancellation_reason?: string | null
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          organization_id: string
          class_id: string
          member_id: string
          status: BookingStatus
          waitlist_position: number | null
          checked_in_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          workout_result: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          class_id: string
          member_id: string
          status?: BookingStatus
          waitlist_position?: number | null
          checked_in_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          workout_result?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: BookingStatus
          waitlist_position?: number | null
          checked_in_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          workout_result?: Json | null
          updated_at?: string
        }
      }
      check_ins: {
        Row: {
          id: string
          organization_id: string
          member_id: string
          checked_in_at: string
          check_in_method: string
          location: string | null
          booking_id: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          member_id: string
          checked_in_at?: string
          check_in_method?: string
          location?: string | null
          booking_id?: string | null
        }
        Update: {
          check_in_method?: string
          location?: string | null
          booking_id?: string | null
        }
      }
      payments: {
        Row: {
          id: string
          organization_id: string
          member_id: string
          amount: number
          currency: string
          membership_plan_id: string | null
          status: PaymentStatus
          payment_provider: string | null
          provider_payment_id: string | null
          provider_response: Json | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          member_id: string
          amount: number
          currency?: string
          membership_plan_id?: string | null
          status?: PaymentStatus
          payment_provider?: string | null
          provider_payment_id?: string | null
          provider_response?: Json | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          currency?: string
          membership_plan_id?: string | null
          status?: PaymentStatus
          payment_provider?: string | null
          provider_payment_id?: string | null
          provider_response?: Json | null
          paid_at?: string | null
          updated_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          organization_id: string | null
          name: string
          name_es: string | null
          name_en: string | null
          description: string | null
          category: string | null
          muscle_groups: string[] | null
          equipment: string[] | null
          difficulty: string
          video_url: string | null
          gif_url: string | null
          thumbnail_url: string | null
          instructions: string[] | null
          tips: string[] | null
          common_mistakes: string[] | null
          is_global: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          name: string
          name_es?: string | null
          name_en?: string | null
          description?: string | null
          category?: string | null
          muscle_groups?: string[] | null
          equipment?: string[] | null
          difficulty?: string
          video_url?: string | null
          gif_url?: string | null
          thumbnail_url?: string | null
          instructions?: string[] | null
          tips?: string[] | null
          common_mistakes?: string[] | null
          is_global?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          name_es?: string | null
          name_en?: string | null
          description?: string | null
          category?: string | null
          muscle_groups?: string[] | null
          equipment?: string[] | null
          difficulty?: string
          video_url?: string | null
          gif_url?: string | null
          thumbnail_url?: string | null
          instructions?: string[] | null
          tips?: string[] | null
          common_mistakes?: string[] | null
          is_global?: boolean
          is_active?: boolean
          updated_at?: string
        }
      }
      workouts: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          workout_type: string
          wod_type: string | null
          wod_time_cap: number | null
          exercises: Json
          assigned_to_member_id: string | null
          assigned_by_id: string | null
          scheduled_date: string | null
          is_template: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          workout_type?: string
          wod_type?: string | null
          wod_time_cap?: number | null
          exercises?: Json
          assigned_to_member_id?: string | null
          assigned_by_id?: string | null
          scheduled_date?: string | null
          is_template?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          workout_type?: string
          wod_type?: string | null
          wod_time_cap?: number | null
          exercises?: Json
          assigned_to_member_id?: string | null
          assigned_by_id?: string | null
          scheduled_date?: string | null
          is_template?: boolean
          is_active?: boolean
          updated_at?: string
        }
      }
      class_templates: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          class_type: string | null
          day_of_week: number
          start_time: string
          end_time: string
          max_capacity: number
          waitlist_enabled: boolean
          max_waitlist: number
          instructor_id: string | null
          instructor_name: string | null
          location: string | null
          booking_opens_hours: number
          booking_closes_minutes: number
          cancellation_deadline_hours: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          class_type?: string | null
          day_of_week: number
          start_time: string
          end_time: string
          max_capacity?: number
          waitlist_enabled?: boolean
          max_waitlist?: number
          instructor_id?: string | null
          instructor_name?: string | null
          location?: string | null
          booking_opens_hours?: number
          booking_closes_minutes?: number
          cancellation_deadline_hours?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          class_type?: string | null
          day_of_week?: number
          start_time?: string
          end_time?: string
          max_capacity?: number
          waitlist_enabled?: boolean
          max_waitlist?: number
          instructor_id?: string | null
          instructor_name?: string | null
          location?: string | null
          booking_opens_hours?: number
          booking_closes_minutes?: number
          cancellation_deadline_hours?: number
          is_active?: boolean
          updated_at?: string
        }
      }
      class_generation_log: {
        Row: {
          id: string
          organization_id: string
          template_id: string
          generated_class_id: string
          generated_date: string
          generated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          template_id: string
          generated_class_id: string
          generated_date: string
          generated_at?: string
        }
        Update: {
          generated_date?: string
          generated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          required_role: UserRole
        }
        Returns: boolean
      }
      is_admin_or_owner: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      business_type: BusinessType
      subscription_plan: SubscriptionPlan
      member_status: MemberStatus
      membership_status: MembershipStatus
      booking_status: BookingStatus
      user_role: UserRole
      payment_status: PaymentStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// =============================================================================
// HELPER TYPES
// =============================================================================

type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Row']

export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update']

export type Enums<T extends keyof PublicSchema['Enums']> =
  PublicSchema['Enums'][T]

export const Constants = {
  public: {
    Enums: {
      business_type: [
        'traditional_gym',
        'crossfit_box',
        'yoga_pilates_studio',
        'hiit_functional',
        'martial_arts',
        'cycling_studio',
        'personal_training',
        'wellness_spa',
        'multi_format',
      ] as const,
      subscription_plan: ['starter', 'growth', 'pro', 'enterprise'] as const,
      member_status: ['active', 'inactive', 'suspended', 'cancelled'] as const,
      membership_status: ['active', 'expired', 'cancelled', 'frozen'] as const,
      booking_status: ['confirmed', 'cancelled', 'attended', 'no_show', 'waitlist'] as const,
      user_role: ['owner', 'admin', 'instructor', 'member'] as const,
      payment_status: ['pending', 'paid', 'failed', 'refunded'] as const,
    },
  },
} as const
