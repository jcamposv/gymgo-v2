-- =============================================================================
-- GYMGO - Multi-Tenant Fitness Platform
-- Initial Database Schema
-- =============================================================================

-- Enable pgcrypto for gen_random_uuid() (available by default in Supabase)
-- No extension needed as gen_random_uuid() is built into PostgreSQL 13+

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE business_type AS ENUM (
  'traditional_gym',
  'crossfit_box',
  'yoga_pilates_studio',
  'hiit_functional',
  'martial_arts',
  'cycling_studio',
  'personal_training',
  'wellness_spa',
  'multi_format'
);

CREATE TYPE subscription_plan AS ENUM (
  'starter',
  'growth',
  'pro',
  'enterprise'
);

CREATE TYPE member_status AS ENUM (
  'active',
  'inactive',
  'suspended',
  'cancelled'
);

CREATE TYPE membership_status AS ENUM (
  'active',
  'expired',
  'cancelled',
  'frozen'
);

CREATE TYPE booking_status AS ENUM (
  'confirmed',
  'cancelled',
  'attended',
  'no_show',
  'waitlist'
);

CREATE TYPE user_role AS ENUM (
  'owner',
  'admin',
  'instructor',
  'member'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'paid',
  'failed',
  'refunded'
);

-- =============================================================================
-- ORGANIZATIONS (Tenants - Gyms)
-- =============================================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  business_type business_type NOT NULL DEFAULT 'traditional_gym',

  -- Contact
  email VARCHAR(255),
  phone VARCHAR(20),
  website VARCHAR(255),

  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2) DEFAULT 'MX',

  -- Branding
  logo_url VARCHAR(500),
  primary_color VARCHAR(7) DEFAULT '#000000',
  secondary_color VARCHAR(7) DEFAULT '#ffffff',

  -- Subscription
  subscription_plan subscription_plan NOT NULL DEFAULT 'starter',
  max_members INTEGER DEFAULT 100,
  max_locations INTEGER DEFAULT 1,
  max_admin_users INTEGER DEFAULT 3,

  -- Features (JSON for flexibility)
  features JSONB DEFAULT '{
    "ai_coach": false,
    "churn_prediction": false,
    "whatsapp_bot": false,
    "wearables_integration": false,
    "video_analysis": false,
    "nutrition": false
  }'::jsonb,

  -- Locale
  language VARCHAR(5) DEFAULT 'es',
  currency VARCHAR(3) DEFAULT 'MXN',
  timezone VARCHAR(50) DEFAULT 'America/Mexico_City',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- =============================================================================
-- PROFILES (Extended user info - linked to auth.users)
-- =============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Basic Info
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  avatar_url VARCHAR(500),
  phone VARCHAR(20),

  -- Role in the organization
  role user_role DEFAULT 'member',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- MEMBERSHIP PLANS (Plans offered by the gym)
-- =============================================================================

CREATE TABLE membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Plan Info
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MXN',
  billing_period VARCHAR(20) DEFAULT 'monthly', -- monthly, quarterly, yearly, one_time

  -- Access Rules
  unlimited_access BOOLEAN DEFAULT true,
  classes_per_period INTEGER, -- NULL = unlimited
  access_all_locations BOOLEAN DEFAULT true,

  -- Validity
  duration_days INTEGER DEFAULT 30,

  -- Features (what's included)
  features JSONB DEFAULT '[]'::jsonb,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  -- Display order
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- MEMBERS (Gym members - can be linked to a profile or standalone)
-- =============================================================================

CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Basic Info (duplicated for members without app access)
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  avatar_url VARCHAR(500),

  -- Personal Info
  date_of_birth DATE,
  gender VARCHAR(10),

  -- Emergency Contact
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),

  -- Health Info
  medical_conditions TEXT,
  injuries TEXT,

  -- Fitness Info
  fitness_goals TEXT[],
  experience_level VARCHAR(20) DEFAULT 'beginner', -- beginner, intermediate, advanced

  -- Status
  status member_status DEFAULT 'active',

  -- Membership
  current_plan_id UUID REFERENCES membership_plans(id) ON DELETE SET NULL,
  membership_start_date DATE,
  membership_end_date DATE,
  membership_status membership_status DEFAULT 'active',

  -- Access
  access_code VARCHAR(20), -- For QR/PIN access

  -- Metrics
  check_in_count INTEGER DEFAULT 0,
  last_check_in TIMESTAMPTZ,

  -- Notes (admin only)
  internal_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_member_per_org UNIQUE (organization_id, email)
);

-- =============================================================================
-- CLASSES (Scheduled classes)
-- =============================================================================

CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Class Info
  name VARCHAR(100) NOT NULL,
  description TEXT,
  class_type VARCHAR(50), -- yoga, crossfit, spinning, etc.

  -- Schedule
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_time - start_time)) / 60
  ) STORED,

  -- Recurrence (for recurring classes)
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule VARCHAR(255), -- RRULE format
  parent_class_id UUID REFERENCES classes(id) ON DELETE CASCADE,

  -- Capacity
  max_capacity INTEGER NOT NULL DEFAULT 20,
  current_bookings INTEGER DEFAULT 0,
  waitlist_enabled BOOLEAN DEFAULT true,
  max_waitlist INTEGER DEFAULT 5,

  -- Instructor
  instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  instructor_name VARCHAR(100), -- Fallback if no profile

  -- Location
  location VARCHAR(100), -- Room/Area name

  -- Booking Rules
  booking_opens_hours INTEGER DEFAULT 168, -- 7 days before
  booking_closes_minutes INTEGER DEFAULT 60, -- 1 hour before
  cancellation_deadline_hours INTEGER DEFAULT 2,

  -- For CrossFit/WOD
  wod_details JSONB, -- { type: 'AMRAP', duration: 20, movements: [...] }

  -- Status
  is_cancelled BOOLEAN DEFAULT false,
  cancellation_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- BOOKINGS (Class reservations)
-- =============================================================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Status
  status booking_status DEFAULT 'confirmed',

  -- Waitlist position (NULL if not on waitlist)
  waitlist_position INTEGER,

  -- Check-in
  checked_in_at TIMESTAMPTZ,

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- For tracking (CrossFit scores, etc.)
  workout_result JSONB, -- { score: '15:30', rx: true, notes: '...' }

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_booking UNIQUE (class_id, member_id)
);

-- =============================================================================
-- CHECK-INS (Access log)
-- =============================================================================

CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Check-in details
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  check_in_method VARCHAR(20) DEFAULT 'qr', -- qr, pin, manual, biometric

  -- Location (for multi-location)
  location VARCHAR(100),

  -- Associated booking (if checking into a class)
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL
);

-- =============================================================================
-- PAYMENTS (Payment history)
-- =============================================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Payment Info
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MXN',

  -- Related plan
  membership_plan_id UUID REFERENCES membership_plans(id) ON DELETE SET NULL,

  -- Status
  status payment_status DEFAULT 'pending',

  -- Provider Info
  payment_provider VARCHAR(50), -- stripe, mercadopago, cash
  provider_payment_id VARCHAR(255),
  provider_response JSONB,

  -- Timestamps
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- EXERCISES (Exercise library)
-- =============================================================================

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL = global

  -- Basic Info
  name VARCHAR(100) NOT NULL,
  name_es VARCHAR(100),
  name_en VARCHAR(100),
  description TEXT,

  -- Classification
  category VARCHAR(50), -- strength, cardio, flexibility, olympic, gymnastics
  muscle_groups TEXT[],
  equipment TEXT[],
  difficulty VARCHAR(20) DEFAULT 'intermediate',

  -- Media
  video_url VARCHAR(500),
  gif_url VARCHAR(500),
  thumbnail_url VARCHAR(500),

  -- Instructions
  instructions TEXT[],
  tips TEXT[],
  common_mistakes TEXT[],

  -- Metadata
  is_global BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- WORKOUTS (Routines / Programs)
-- =============================================================================

CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Basic Info
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Type
  workout_type VARCHAR(50) DEFAULT 'routine', -- routine, wod, program

  -- For WODs
  wod_type VARCHAR(20), -- amrap, emom, for_time, tabata
  wod_time_cap INTEGER, -- in minutes

  -- Exercises (ordered list)
  exercises JSONB DEFAULT '[]'::jsonb,
  -- Format: [{ exercise_id, sets, reps, weight, rest_seconds, notes }]

  -- Assignment
  assigned_to_member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  assigned_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Schedule
  scheduled_date DATE,

  -- Status
  is_template BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Organizations
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Profiles
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Members
CREATE INDEX idx_members_organization ON members(organization_id);
CREATE INDEX idx_members_email ON members(organization_id, email);
CREATE INDEX idx_members_status ON members(organization_id, status);
CREATE INDEX idx_members_profile ON members(profile_id);

-- Membership Plans
CREATE INDEX idx_membership_plans_organization ON membership_plans(organization_id);
CREATE INDEX idx_membership_plans_active ON membership_plans(organization_id, is_active);

-- Classes
CREATE INDEX idx_classes_organization ON classes(organization_id);
CREATE INDEX idx_classes_start_time ON classes(organization_id, start_time);
CREATE INDEX idx_classes_instructor ON classes(instructor_id);

-- Bookings
CREATE INDEX idx_bookings_class ON bookings(class_id);
CREATE INDEX idx_bookings_member ON bookings(member_id);
CREATE INDEX idx_bookings_status ON bookings(organization_id, status);

-- Check-ins
CREATE INDEX idx_check_ins_member ON check_ins(member_id);
CREATE INDEX idx_check_ins_date ON check_ins(organization_id, checked_in_at);

-- Payments
CREATE INDEX idx_payments_member ON payments(member_id);
CREATE INDEX idx_payments_status ON payments(organization_id, status);

-- Exercises
CREATE INDEX idx_exercises_organization ON exercises(organization_id);
CREATE INDEX idx_exercises_global ON exercises(is_global) WHERE is_global = true;

-- Workouts
CREATE INDEX idx_workouts_organization ON workouts(organization_id);
CREATE INDEX idx_workouts_member ON workouts(assigned_to_member_id);
CREATE INDEX idx_workouts_date ON workouts(organization_id, scheduled_date);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_membership_plans_updated_at
  BEFORE UPDATE ON membership_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_workouts_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- FUNCTION: Auto-create profile on user signup
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- FUNCTION: Update booking count on class
-- =============================================================================

CREATE OR REPLACE FUNCTION update_class_booking_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE classes SET current_bookings = current_bookings + 1 WHERE id = NEW.class_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
      UPDATE classes SET current_bookings = current_bookings + 1 WHERE id = NEW.class_id;
    ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
      UPDATE classes SET current_bookings = GREATEST(current_bookings - 1, 0) WHERE id = NEW.class_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
    UPDATE classes SET current_bookings = GREATEST(current_bookings - 1, 0) WHERE id = OLD.class_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_booking_count
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_class_booking_count();

-- =============================================================================
-- FUNCTION: Update member check-in count
-- =============================================================================

CREATE OR REPLACE FUNCTION update_member_check_in()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE members
  SET
    check_in_count = check_in_count + 1,
    last_check_in = NEW.checked_in_at
  WHERE id = NEW.member_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_check_in
  AFTER INSERT ON check_ins
  FOR EACH ROW EXECUTE FUNCTION update_member_check_in();
