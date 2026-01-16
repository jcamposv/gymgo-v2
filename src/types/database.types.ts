export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          checked_in_at: string | null
          class_id: string
          created_at: string | null
          id: string
          member_id: string
          organization_id: string
          status: Database["public"]["Enums"]["booking_status"] | null
          updated_at: string | null
          waitlist_position: number | null
          workout_result: Json | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          checked_in_at?: string | null
          class_id: string
          created_at?: string | null
          id?: string
          member_id: string
          organization_id: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          updated_at?: string | null
          waitlist_position?: number | null
          workout_result?: Json | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          checked_in_at?: string | null
          class_id?: string
          created_at?: string | null
          id?: string
          member_id?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          updated_at?: string | null
          waitlist_position?: number | null
          workout_result?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          booking_id: string | null
          check_in_method: string | null
          checked_in_at: string | null
          id: string
          location: string | null
          member_id: string
          organization_id: string
        }
        Insert: {
          booking_id?: string | null
          check_in_method?: string | null
          checked_in_at?: string | null
          id?: string
          location?: string | null
          member_id: string
          organization_id: string
        }
        Update: {
          booking_id?: string | null
          check_in_method?: string | null
          checked_in_at?: string | null
          id?: string
          location?: string | null
          member_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      class_generation_log: {
        Row: {
          generated_at: string | null
          generated_class_id: string
          generated_date: string
          id: string
          organization_id: string
          template_id: string
        }
        Insert: {
          generated_at?: string | null
          generated_class_id: string
          generated_date: string
          id?: string
          organization_id: string
          template_id: string
        }
        Update: {
          generated_at?: string | null
          generated_class_id?: string
          generated_date?: string
          id?: string
          organization_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_generation_log_generated_class_id_fkey"
            columns: ["generated_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_generation_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_generation_log_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "class_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      class_templates: {
        Row: {
          booking_closes_minutes: number | null
          booking_opens_hours: number | null
          cancellation_deadline_hours: number | null
          class_type: string | null
          created_at: string | null
          day_of_week: number
          description: string | null
          end_time: string
          id: string
          instructor_id: string | null
          instructor_name: string | null
          is_active: boolean | null
          location: string | null
          max_capacity: number | null
          max_waitlist: number | null
          name: string
          organization_id: string
          start_time: string
          updated_at: string | null
          waitlist_enabled: boolean | null
        }
        Insert: {
          booking_closes_minutes?: number | null
          booking_opens_hours?: number | null
          cancellation_deadline_hours?: number | null
          class_type?: string | null
          created_at?: string | null
          day_of_week: number
          description?: string | null
          end_time: string
          id?: string
          instructor_id?: string | null
          instructor_name?: string | null
          is_active?: boolean | null
          location?: string | null
          max_capacity?: number | null
          max_waitlist?: number | null
          name: string
          organization_id: string
          start_time: string
          updated_at?: string | null
          waitlist_enabled?: boolean | null
        }
        Update: {
          booking_closes_minutes?: number | null
          booking_opens_hours?: number | null
          cancellation_deadline_hours?: number | null
          class_type?: string | null
          created_at?: string | null
          day_of_week?: number
          description?: string | null
          end_time?: string
          id?: string
          instructor_id?: string | null
          instructor_name?: string | null
          is_active?: boolean | null
          location?: string | null
          max_capacity?: number | null
          max_waitlist?: number | null
          name?: string
          organization_id?: string
          start_time?: string
          updated_at?: string | null
          waitlist_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "class_templates_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          booking_closes_minutes: number | null
          booking_opens_hours: number | null
          cancellation_deadline_hours: number | null
          cancellation_reason: string | null
          class_type: string | null
          created_at: string | null
          current_bookings: number | null
          description: string | null
          duration_minutes: number | null
          end_time: string
          id: string
          instructor_id: string | null
          instructor_name: string | null
          is_cancelled: boolean | null
          is_recurring: boolean | null
          location: string | null
          max_capacity: number
          max_waitlist: number | null
          name: string
          organization_id: string
          parent_class_id: string | null
          recurrence_rule: string | null
          start_time: string
          updated_at: string | null
          waitlist_enabled: boolean | null
          wod_details: Json | null
        }
        Insert: {
          booking_closes_minutes?: number | null
          booking_opens_hours?: number | null
          cancellation_deadline_hours?: number | null
          cancellation_reason?: string | null
          class_type?: string | null
          created_at?: string | null
          current_bookings?: number | null
          description?: string | null
          duration_minutes?: number | null
          end_time: string
          id?: string
          instructor_id?: string | null
          instructor_name?: string | null
          is_cancelled?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          max_capacity?: number
          max_waitlist?: number | null
          name: string
          organization_id: string
          parent_class_id?: string | null
          recurrence_rule?: string | null
          start_time: string
          updated_at?: string | null
          waitlist_enabled?: boolean | null
          wod_details?: Json | null
        }
        Update: {
          booking_closes_minutes?: number | null
          booking_opens_hours?: number | null
          cancellation_deadline_hours?: number | null
          cancellation_reason?: string | null
          class_type?: string | null
          created_at?: string | null
          current_bookings?: number | null
          description?: string | null
          duration_minutes?: number | null
          end_time?: string
          id?: string
          instructor_id?: string | null
          instructor_name?: string | null
          is_cancelled?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          max_capacity?: number
          max_waitlist?: number | null
          name?: string
          organization_id?: string
          parent_class_id?: string | null
          recurrence_rule?: string | null
          start_time?: string
          updated_at?: string | null
          waitlist_enabled?: boolean | null
          wod_details?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_parent_class_id_fkey"
            columns: ["parent_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: string | null
          common_mistakes: string[] | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          equipment: string[] | null
          gif_url: string | null
          id: string
          instructions: string[] | null
          is_active: boolean | null
          is_global: boolean | null
          muscle_groups: string[] | null
          name: string
          name_en: string | null
          name_es: string | null
          organization_id: string | null
          thumbnail_url: string | null
          tips: string[] | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          category?: string | null
          common_mistakes?: string[] | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          equipment?: string[] | null
          gif_url?: string | null
          id?: string
          instructions?: string[] | null
          is_active?: boolean | null
          is_global?: boolean | null
          muscle_groups?: string[] | null
          name: string
          name_en?: string | null
          name_es?: string | null
          organization_id?: string | null
          thumbnail_url?: string | null
          tips?: string[] | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          category?: string | null
          common_mistakes?: string[] | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          equipment?: string[] | null
          gif_url?: string | null
          id?: string
          instructions?: string[] | null
          is_active?: boolean | null
          is_global?: boolean | null
          muscle_groups?: string[] | null
          name?: string
          name_en?: string | null
          name_es?: string | null
          organization_id?: string | null
          thumbnail_url?: string | null
          tips?: string[] | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"] | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string
          expense_date: string | null
          id: string
          is_recurring: boolean | null
          notes: string | null
          organization_id: string
          receipt_url: string | null
          updated_at: string | null
          vendor: string | null
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["expense_category"] | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description: string
          expense_date?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          organization_id: string
          receipt_url?: string | null
          updated_at?: string | null
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"] | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string
          expense_date?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          organization_id?: string
          receipt_url?: string | null
          updated_at?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_whatsapp_settings: {
        Row: {
          auto_opt_in_new_members: boolean | null
          created_at: string | null
          created_by: string | null
          id: string
          is_enabled: boolean | null
          last_sync_at: string | null
          organization_id: string
          reminder_days_before: number[] | null
          reminder_hour: number | null
          send_membership_expiry_warning: boolean | null
          send_payment_confirmation: boolean | null
          setup_status:
            | Database["public"]["Enums"]["whatsapp_setup_status"]
            | null
          twilio_account_sid: string
          twilio_auth_token: string
          twilio_subaccount_name: string | null
          updated_at: string | null
          whatsapp_phone_number: string | null
          whatsapp_sender_sid: string | null
        }
        Insert: {
          auto_opt_in_new_members?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_enabled?: boolean | null
          last_sync_at?: string | null
          organization_id: string
          reminder_days_before?: number[] | null
          reminder_hour?: number | null
          send_membership_expiry_warning?: boolean | null
          send_payment_confirmation?: boolean | null
          setup_status?:
            | Database["public"]["Enums"]["whatsapp_setup_status"]
            | null
          twilio_account_sid: string
          twilio_auth_token: string
          twilio_subaccount_name?: string | null
          updated_at?: string | null
          whatsapp_phone_number?: string | null
          whatsapp_sender_sid?: string | null
        }
        Update: {
          auto_opt_in_new_members?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_enabled?: boolean | null
          last_sync_at?: string | null
          organization_id?: string
          reminder_days_before?: number[] | null
          reminder_hour?: number | null
          send_membership_expiry_warning?: boolean | null
          send_payment_confirmation?: boolean | null
          setup_status?:
            | Database["public"]["Enums"]["whatsapp_setup_status"]
            | null
          twilio_account_sid?: string
          twilio_auth_token?: string
          twilio_subaccount_name?: string | null
          updated_at?: string | null
          whatsapp_phone_number?: string | null
          whatsapp_sender_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gym_whatsapp_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_whatsapp_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      income: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["income_category"] | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string
          id: string
          income_date: string | null
          notes: string | null
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["income_category"] | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description: string
          id?: string
          income_date?: string | null
          notes?: string | null
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["income_category"] | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string
          id?: string
          income_date?: string | null
          notes?: string | null
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      member_measurements: {
        Row: {
          arm_cm: number | null
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          blood_sugar_mg_dl: number | null
          body_fat_percentage: number | null
          body_height_cm: number | null
          body_height_ft: number | null
          body_height_in: number | null
          body_mass_index: number | null
          body_weight_kg: number | null
          body_weight_lbs: number | null
          chest_cm: number | null
          cholesterol_mg_dl: number | null
          created_at: string | null
          heart_rate_bpm: number | null
          hemoglobin_g_dl: number | null
          hip_cm: number | null
          id: string
          measured_at: string
          member_id: string
          muscle_mass_kg: number | null
          notes: string | null
          organization_id: string
          recorded_by_id: string | null
          respiratory_rate: number | null
          thigh_cm: number | null
          updated_at: string | null
          waist_cm: number | null
        }
        Insert: {
          arm_cm?: number | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          blood_sugar_mg_dl?: number | null
          body_fat_percentage?: number | null
          body_height_cm?: number | null
          body_height_ft?: number | null
          body_height_in?: number | null
          body_mass_index?: number | null
          body_weight_kg?: number | null
          body_weight_lbs?: number | null
          chest_cm?: number | null
          cholesterol_mg_dl?: number | null
          created_at?: string | null
          heart_rate_bpm?: number | null
          hemoglobin_g_dl?: number | null
          hip_cm?: number | null
          id?: string
          measured_at?: string
          member_id: string
          muscle_mass_kg?: number | null
          notes?: string | null
          organization_id: string
          recorded_by_id?: string | null
          respiratory_rate?: number | null
          thigh_cm?: number | null
          updated_at?: string | null
          waist_cm?: number | null
        }
        Update: {
          arm_cm?: number | null
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          blood_sugar_mg_dl?: number | null
          body_fat_percentage?: number | null
          body_height_cm?: number | null
          body_height_ft?: number | null
          body_height_in?: number | null
          body_mass_index?: number | null
          body_weight_kg?: number | null
          body_weight_lbs?: number | null
          chest_cm?: number | null
          cholesterol_mg_dl?: number | null
          created_at?: string | null
          heart_rate_bpm?: number | null
          hemoglobin_g_dl?: number | null
          hip_cm?: number | null
          id?: string
          measured_at?: string
          member_id?: string
          muscle_mass_kg?: number | null
          notes?: string | null
          organization_id?: string
          recorded_by_id?: string | null
          respiratory_rate?: number | null
          thigh_cm?: number | null
          updated_at?: string | null
          waist_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "member_measurements_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_measurements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_measurements_recorded_by_id_fkey"
            columns: ["recorded_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_notes: {
        Row: {
          content: string
          created_at: string | null
          created_by_id: string | null
          created_by_name: string | null
          id: string
          member_id: string
          organization_id: string
          title: string
          type: Database["public"]["Enums"]["note_type"] | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by_id?: string | null
          created_by_name?: string | null
          id?: string
          member_id: string
          organization_id: string
          title: string
          type?: Database["public"]["Enums"]["note_type"] | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by_id?: string | null
          created_by_name?: string | null
          id?: string
          member_id?: string
          organization_id?: string
          title?: string
          type?: Database["public"]["Enums"]["note_type"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_notes_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      member_notification_preferences: {
        Row: {
          created_at: string | null
          id: string
          member_id: string
          organization_id: string
          push_class_reminders: boolean | null
          push_enabled: boolean | null
          push_payment_reminders: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          receive_class_reminders: boolean | null
          receive_membership_alerts: boolean | null
          receive_payment_confirmations: boolean | null
          receive_payment_reminders: boolean | null
          receive_promotional: boolean | null
          updated_at: string | null
          whatsapp_opted_in: boolean | null
          whatsapp_opted_in_at: string | null
          whatsapp_opted_out_at: string | null
          whatsapp_phone: string | null
          whatsapp_phone_verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          member_id: string
          organization_id: string
          push_class_reminders?: boolean | null
          push_enabled?: boolean | null
          push_payment_reminders?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          receive_class_reminders?: boolean | null
          receive_membership_alerts?: boolean | null
          receive_payment_confirmations?: boolean | null
          receive_payment_reminders?: boolean | null
          receive_promotional?: boolean | null
          updated_at?: string | null
          whatsapp_opted_in?: boolean | null
          whatsapp_opted_in_at?: string | null
          whatsapp_opted_out_at?: string | null
          whatsapp_phone?: string | null
          whatsapp_phone_verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          member_id?: string
          organization_id?: string
          push_class_reminders?: boolean | null
          push_enabled?: boolean | null
          push_payment_reminders?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          receive_class_reminders?: boolean | null
          receive_membership_alerts?: boolean | null
          receive_payment_confirmations?: boolean | null
          receive_payment_reminders?: boolean | null
          receive_promotional?: boolean | null
          updated_at?: string | null
          whatsapp_opted_in?: boolean | null
          whatsapp_opted_in_at?: string | null
          whatsapp_opted_out_at?: string | null
          whatsapp_phone?: string | null
          whatsapp_phone_verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "member_notification_preferences_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_notification_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      member_reports: {
        Row: {
          created_at: string | null
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          member_id: string
          organization_id: string
          title: string
          uploaded_by_id: string | null
          uploaded_by_name: string | null
        }
        Insert: {
          created_at?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          member_id: string
          organization_id: string
          title: string
          uploaded_by_id?: string | null
          uploaded_by_name?: string | null
        }
        Update: {
          created_at?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          member_id?: string
          organization_id?: string
          title?: string
          uploaded_by_id?: string | null
          uploaded_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_reports_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_reports_uploaded_by_id_fkey"
            columns: ["uploaded_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          access_code: string | null
          address_line1: string | null
          address_line2: string | null
          avatar_url: string | null
          check_in_count: number | null
          city: string | null
          country: string | null
          created_at: string | null
          current_plan_id: string | null
          date_of_birth: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          experience_level: string | null
          fitness_goals: string[] | null
          full_name: string
          gender: string | null
          id: string
          injuries: string | null
          internal_notes: string | null
          invitation_accepted_at: string | null
          invitation_sent_at: string | null
          last_check_in: string | null
          medical_conditions: string | null
          membership_end_date: string | null
          membership_start_date: string | null
          membership_status:
            | Database["public"]["Enums"]["membership_status"]
            | null
          organization_id: string
          phone: string | null
          postal_code: string | null
          profile_id: string | null
          state: string | null
          status: Database["public"]["Enums"]["member_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_code?: string | null
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          check_in_count?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          current_plan_id?: string | null
          date_of_birth?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          experience_level?: string | null
          fitness_goals?: string[] | null
          full_name: string
          gender?: string | null
          id?: string
          injuries?: string | null
          internal_notes?: string | null
          invitation_accepted_at?: string | null
          invitation_sent_at?: string | null
          last_check_in?: string | null
          medical_conditions?: string | null
          membership_end_date?: string | null
          membership_start_date?: string | null
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          profile_id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["member_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_code?: string | null
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          check_in_count?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          current_plan_id?: string | null
          date_of_birth?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          experience_level?: string | null
          fitness_goals?: string[] | null
          full_name?: string
          gender?: string | null
          id?: string
          injuries?: string | null
          internal_notes?: string | null
          invitation_accepted_at?: string | null
          invitation_sent_at?: string | null
          last_check_in?: string | null
          medical_conditions?: string | null
          membership_end_date?: string | null
          membership_start_date?: string | null
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          profile_id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["member_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_current_plan_id_fkey"
            columns: ["current_plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          access_all_locations: boolean | null
          billing_period: string | null
          classes_per_period: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          duration_days: number | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          organization_id: string
          price: number
          sort_order: number | null
          unlimited_access: boolean | null
          updated_at: string | null
        }
        Insert: {
          access_all_locations?: boolean | null
          billing_period?: string | null
          classes_per_period?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration_days?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          organization_id: string
          price: number
          sort_order?: number | null
          unlimited_access?: boolean | null
          updated_at?: string | null
        }
        Update: {
          access_all_locations?: boolean | null
          billing_period?: string | null
          classes_per_period?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration_days?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          organization_id?: string
          price?: number
          sort_order?: number | null
          unlimited_access?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_delivery_log: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string | null
          delivered_at: string | null
          error_code: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          idempotency_key: string | null
          max_retries: number | null
          member_id: string | null
          next_retry_at: string | null
          notification_type: string
          organization_id: string
          provider: string | null
          provider_message_id: string | null
          provider_response: Json | null
          provider_status: string | null
          read_at: string | null
          recipient_device_token: string | null
          recipient_email: string | null
          recipient_phone: string | null
          retry_count: number | null
          sent_at: string | null
          status:
            | Database["public"]["Enums"]["notification_delivery_status"]
            | null
          subject: string | null
          template_id: string | null
          updated_at: string | null
          variables_used: Json | null
        }
        Insert: {
          body: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string | null
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key?: string | null
          max_retries?: number | null
          member_id?: string | null
          next_retry_at?: string | null
          notification_type: string
          organization_id: string
          provider?: string | null
          provider_message_id?: string | null
          provider_response?: Json | null
          provider_status?: string | null
          read_at?: string | null
          recipient_device_token?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?:
            | Database["public"]["Enums"]["notification_delivery_status"]
            | null
          subject?: string | null
          template_id?: string | null
          updated_at?: string | null
          variables_used?: Json | null
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string | null
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key?: string | null
          max_retries?: number | null
          member_id?: string | null
          next_retry_at?: string | null
          notification_type?: string
          organization_id?: string
          provider?: string | null
          provider_message_id?: string | null
          provider_response?: Json | null
          provider_status?: string | null
          read_at?: string | null
          recipient_device_token?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?:
            | Database["public"]["Enums"]["notification_delivery_status"]
            | null
          subject?: string | null
          template_id?: string | null
          updated_at?: string | null
          variables_used?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_delivery_log_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_delivery_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_delivery_log_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          business_type: Database["public"]["Enums"]["business_type"]
          city: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          email: string | null
          features: Json | null
          id: string
          language: string | null
          logo_url: string | null
          max_admin_users: number | null
          max_classes_per_day: number | null
          max_locations: number | null
          max_members: number | null
          name: string
          phone: string | null
          postal_code: string | null
          primary_color: string | null
          secondary_color: string | null
          slug: string
          state: string | null
          subscription_plan: Database["public"]["Enums"]["subscription_plan"]
          timezone: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          business_type?: Database["public"]["Enums"]["business_type"]
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          features?: Json | null
          id?: string
          language?: string | null
          logo_url?: string | null
          max_admin_users?: number | null
          max_classes_per_day?: number | null
          max_locations?: number | null
          max_members?: number | null
          name: string
          phone?: string | null
          postal_code?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          state?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          business_type?: Database["public"]["Enums"]["business_type"]
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          features?: Json | null
          id?: string
          language?: string | null
          logo_url?: string | null
          max_admin_users?: number | null
          max_classes_per_day?: number | null
          max_locations?: number | null
          max_members?: number | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          state?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          currency: string | null
          id: string
          member_id: string
          notes: string | null
          organization_id: string
          paid_at: string | null
          payment_date: string | null
          payment_method: string | null
          payment_provider: string | null
          plan_id: string | null
          provider_payment_id: string | null
          provider_response: Json | null
          reference_number: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          id?: string
          member_id: string
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          plan_id?: string | null
          provider_payment_id?: string | null
          provider_response?: Json | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          id?: string
          member_id?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          plan_id?: string | null
          provider_payment_id?: string | null
          provider_response?: Json | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_membership_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          organization_id: string | null
          phone: string | null
          preferred_view:
            | Database["public"]["Enums"]["preferred_view_type"]
            | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          organization_id?: string | null
          phone?: string | null
          preferred_view?:
            | Database["public"]["Enums"]["preferred_view_type"]
            | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          organization_id?: string | null
          phone?: string | null
          preferred_view?:
            | Database["public"]["Enums"]["preferred_view_type"]
            | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          body_text: string
          created_at: string | null
          created_by: string | null
          cta_buttons: Json | null
          footer_text: string | null
          header_text: string | null
          id: string
          is_default: boolean | null
          language: string | null
          last_used_at: string | null
          name: string
          organization_id: string
          rejection_reason: string | null
          send_count: number | null
          status: Database["public"]["Enums"]["whatsapp_template_status"] | null
          template_type: Database["public"]["Enums"]["whatsapp_template_type"]
          twilio_content_sid: string | null
          twilio_template_name: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          body_text: string
          created_at?: string | null
          created_by?: string | null
          cta_buttons?: Json | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          is_default?: boolean | null
          language?: string | null
          last_used_at?: string | null
          name: string
          organization_id: string
          rejection_reason?: string | null
          send_count?: number | null
          status?:
            | Database["public"]["Enums"]["whatsapp_template_status"]
            | null
          template_type: Database["public"]["Enums"]["whatsapp_template_type"]
          twilio_content_sid?: string | null
          twilio_template_name?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          body_text?: string
          created_at?: string | null
          created_by?: string | null
          cta_buttons?: Json | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          is_default?: boolean | null
          language?: string | null
          last_used_at?: string | null
          name?: string
          organization_id?: string
          rejection_reason?: string | null
          send_count?: number | null
          status?:
            | Database["public"]["Enums"]["whatsapp_template_status"]
            | null
          template_type?: Database["public"]["Enums"]["whatsapp_template_type"]
          twilio_content_sid?: string | null
          twilio_template_name?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          assigned_by_id: string | null
          assigned_to_member_id: string | null
          created_at: string | null
          description: string | null
          exercises: Json | null
          id: string
          is_active: boolean | null
          is_template: boolean | null
          name: string
          organization_id: string
          scheduled_date: string | null
          updated_at: string | null
          wod_time_cap: number | null
          wod_type: string | null
          workout_type: string | null
        }
        Insert: {
          assigned_by_id?: string | null
          assigned_to_member_id?: string | null
          created_at?: string | null
          description?: string | null
          exercises?: Json | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          name: string
          organization_id: string
          scheduled_date?: string | null
          updated_at?: string | null
          wod_time_cap?: number | null
          wod_type?: string | null
          workout_type?: string | null
        }
        Update: {
          assigned_by_id?: string | null
          assigned_to_member_id?: string | null
          created_at?: string | null
          description?: string | null
          exercises?: Json | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          name?: string
          organization_id?: string
          scheduled_date?: string | null
          updated_at?: string | null
          wod_time_cap?: number | null
          wod_type?: string | null
          workout_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_assigned_by_id_fkey"
            columns: ["assigned_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_assigned_to_member_id_fkey"
            columns: ["assigned_to_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_organization_id: { Args: never; Returns: string }
      has_role: {
        Args: { required_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      is_admin_level: { Args: never; Returns: boolean }
      is_admin_or_owner: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      is_staff_member: { Args: never; Returns: boolean }
    }
    Enums: {
      booking_status:
        | "confirmed"
        | "cancelled"
        | "attended"
        | "no_show"
        | "waitlist"
      business_type:
        | "traditional_gym"
        | "crossfit_box"
        | "yoga_pilates_studio"
        | "hiit_functional"
        | "martial_arts"
        | "cycling_studio"
        | "personal_training"
        | "wellness_spa"
        | "multi_format"
      expense_category:
        | "rent"
        | "utilities"
        | "salaries"
        | "equipment"
        | "maintenance"
        | "marketing"
        | "supplies"
        | "insurance"
        | "taxes"
        | "other"
      income_category:
        | "product_sale"
        | "service"
        | "rental"
        | "event"
        | "donation"
        | "other"
      member_status: "active" | "inactive" | "suspended" | "cancelled"
      membership_status: "active" | "expired" | "cancelled" | "frozen"
      note_type:
        | "notes"
        | "trainer_comments"
        | "progress"
        | "medical"
        | "general"
      notification_channel: "push" | "whatsapp" | "email" | "sms"
      notification_delivery_status:
        | "pending"
        | "queued"
        | "sent"
        | "delivered"
        | "read"
        | "failed"
        | "undelivered"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      preferred_view_type: "dashboard" | "member"
      subscription_plan: "starter" | "growth" | "pro" | "enterprise"
      user_role:
        | "owner"
        | "admin"
        | "instructor"
        | "member"
        | "super_admin"
        | "assistant"
        | "nutritionist"
        | "trainer"
        | "client"
      whatsapp_setup_status:
        | "pending"
        | "phone_pending"
        | "active"
        | "suspended"
      whatsapp_template_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "disabled"
      whatsapp_template_type:
        | "payment_reminder"
        | "payment_overdue"
        | "payment_confirmation"
        | "membership_expiring"
        | "membership_expired"
        | "welcome"
        | "custom"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_status: [
        "confirmed",
        "cancelled",
        "attended",
        "no_show",
        "waitlist",
      ],
      business_type: [
        "traditional_gym",
        "crossfit_box",
        "yoga_pilates_studio",
        "hiit_functional",
        "martial_arts",
        "cycling_studio",
        "personal_training",
        "wellness_spa",
        "multi_format",
      ],
      expense_category: [
        "rent",
        "utilities",
        "salaries",
        "equipment",
        "maintenance",
        "marketing",
        "supplies",
        "insurance",
        "taxes",
        "other",
      ],
      income_category: [
        "product_sale",
        "service",
        "rental",
        "event",
        "donation",
        "other",
      ],
      member_status: ["active", "inactive", "suspended", "cancelled"],
      membership_status: ["active", "expired", "cancelled", "frozen"],
      note_type: [
        "notes",
        "trainer_comments",
        "progress",
        "medical",
        "general",
      ],
      notification_channel: ["push", "whatsapp", "email", "sms"],
      notification_delivery_status: [
        "pending",
        "queued",
        "sent",
        "delivered",
        "read",
        "failed",
        "undelivered",
      ],
      payment_status: ["pending", "paid", "failed", "refunded"],
      preferred_view_type: ["dashboard", "member"],
      subscription_plan: ["starter", "growth", "pro", "enterprise"],
      user_role: [
        "owner",
        "admin",
        "instructor",
        "member",
        "super_admin",
        "assistant",
        "nutritionist",
        "trainer",
        "client",
      ],
      whatsapp_setup_status: [
        "pending",
        "phone_pending",
        "active",
        "suspended",
      ],
      whatsapp_template_status: [
        "draft",
        "pending_approval",
        "approved",
        "rejected",
        "disabled",
      ],
      whatsapp_template_type: [
        "payment_reminder",
        "payment_overdue",
        "payment_confirmation",
        "membership_expiring",
        "membership_expired",
        "welcome",
        "custom",
      ],
    },
  },
} as const
