-- =============================================================================
-- MEMBER MEASUREMENTS, NOTES & REPORTS
-- Migration to add member health tracking features
-- =============================================================================

-- =============================================================================
-- 0. CREATE HELPER FUNCTION FOR UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 1. ALTER MEMBERS TABLE - Add address and emergency contact relation
-- =============================================================================

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(100),
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'USA',
  ADD COLUMN IF NOT EXISTS emergency_contact_relation VARCHAR(50);

-- =============================================================================
-- 2. MEMBER MEASUREMENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS member_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- When the measurement was taken
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Body measurements (Imperial)
  body_height_ft INTEGER,
  body_height_in DECIMAL(4, 1),
  body_weight_lbs DECIMAL(6, 2),

  -- Body measurements (Metric - for international support)
  body_height_cm DECIMAL(5, 1),
  body_weight_kg DECIMAL(5, 2),

  -- Calculated
  body_mass_index DECIMAL(4, 1),
  body_fat_percentage DECIMAL(4, 1),
  muscle_mass_kg DECIMAL(5, 2),

  -- Vital signs
  heart_rate_bpm INTEGER,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  respiratory_rate INTEGER,

  -- Blood work
  cholesterol_mg_dl INTEGER,
  blood_sugar_mg_dl INTEGER,
  hemoglobin_g_dl DECIMAL(4, 1),

  -- Body circumference measurements (cm)
  waist_cm DECIMAL(5, 1),
  hip_cm DECIMAL(5, 1),
  chest_cm DECIMAL(5, 1),
  arm_cm DECIMAL(5, 1),
  thigh_cm DECIMAL(5, 1),

  -- Additional notes
  notes TEXT,

  -- Who recorded this (staff member)
  recorded_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for member_measurements
CREATE INDEX IF NOT EXISTS idx_member_measurements_member_id ON member_measurements(member_id);
CREATE INDEX IF NOT EXISTS idx_member_measurements_organization_id ON member_measurements(organization_id);
CREATE INDEX IF NOT EXISTS idx_member_measurements_measured_at ON member_measurements(measured_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_member_measurements_updated_at
  BEFORE UPDATE ON member_measurements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 3. MEMBER NOTES TABLE
-- =============================================================================

CREATE TYPE note_type AS ENUM ('notes', 'trainer_comments', 'progress', 'medical', 'general');

CREATE TABLE IF NOT EXISTS member_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Note content
  type note_type DEFAULT 'general',
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,

  -- Who created this
  created_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by_name VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for member_notes
CREATE INDEX IF NOT EXISTS idx_member_notes_member_id ON member_notes(member_id);
CREATE INDEX IF NOT EXISTS idx_member_notes_organization_id ON member_notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_member_notes_type ON member_notes(type);
CREATE INDEX IF NOT EXISTS idx_member_notes_created_at ON member_notes(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_member_notes_updated_at
  BEFORE UPDATE ON member_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 4. MEMBER REPORTS TABLE (Files/Documents)
-- =============================================================================

CREATE TABLE IF NOT EXISTS member_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- File info
  title VARCHAR(200) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) DEFAULT 'application/pdf',
  file_size_bytes INTEGER,

  -- Who uploaded this
  uploaded_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  uploaded_by_name VARCHAR(100),

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for member_reports
CREATE INDEX IF NOT EXISTS idx_member_reports_member_id ON member_reports(member_id);
CREATE INDEX IF NOT EXISTS idx_member_reports_organization_id ON member_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_member_reports_created_at ON member_reports(created_at DESC);

-- =============================================================================
-- 5. RLS POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE member_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_reports ENABLE ROW LEVEL SECURITY;

-- MEMBER MEASUREMENTS POLICIES
CREATE POLICY "Users can view org member measurements"
  ON member_measurements FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Staff can insert member measurements"
  ON member_measurements FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND (is_admin_or_owner() OR has_role('instructor'))
  );

CREATE POLICY "Staff can update member measurements"
  ON member_measurements FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND (is_admin_or_owner() OR has_role('instructor'))
  );

CREATE POLICY "Admins can delete member measurements"
  ON member_measurements FOR DELETE
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

-- MEMBER NOTES POLICIES
CREATE POLICY "Users can view org member notes"
  ON member_notes FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Staff can insert member notes"
  ON member_notes FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND (is_admin_or_owner() OR has_role('instructor'))
  );

CREATE POLICY "Staff can update their own notes"
  ON member_notes FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND (created_by_id = auth.uid() OR is_admin_or_owner())
  );

CREATE POLICY "Admins can delete member notes"
  ON member_notes FOR DELETE
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

-- MEMBER REPORTS POLICIES
CREATE POLICY "Users can view org member reports"
  ON member_reports FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Staff can insert member reports"
  ON member_reports FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND (is_admin_or_owner() OR has_role('instructor'))
  );

CREATE POLICY "Admins can delete member reports"
  ON member_reports FOR DELETE
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

-- =============================================================================
-- 6. COMMENTS
-- =============================================================================

COMMENT ON TABLE member_measurements IS 'Stores body measurements and health metrics history for gym members';
COMMENT ON TABLE member_notes IS 'Stores notes, comments and progress updates for gym members';
COMMENT ON TABLE member_reports IS 'Stores files and documents uploaded for gym members (fitness reports, medical docs, etc)';
