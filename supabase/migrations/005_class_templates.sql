-- =============================================================================
-- GYMGO - Class Templates Feature
-- Weekly schedule templates with auto-generation
-- =============================================================================

-- =============================================================================
-- CLASS TEMPLATES TABLE
-- Stores weekly recurring class patterns
-- =============================================================================

CREATE TABLE class_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template Info
  name VARCHAR(100) NOT NULL,
  description TEXT,
  class_type VARCHAR(50),

  -- Schedule (weekly pattern)
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Capacity
  max_capacity INTEGER DEFAULT 20,
  waitlist_enabled BOOLEAN DEFAULT true,
  max_waitlist INTEGER DEFAULT 5,

  -- Instructor
  instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  instructor_name VARCHAR(100),

  -- Location
  location VARCHAR(100),

  -- Booking Rules
  booking_opens_hours INTEGER DEFAULT 168, -- 7 days before
  booking_closes_minutes INTEGER DEFAULT 60, -- 1 hour before
  cancellation_deadline_hours INTEGER DEFAULT 2,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- CLASS GENERATION LOG TABLE
-- Tracks which classes were generated from which templates to prevent duplicates
-- =============================================================================

CREATE TABLE class_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES class_templates(id) ON DELETE CASCADE,
  generated_class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  generated_date DATE NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent generating the same template for the same date twice
  CONSTRAINT unique_template_date UNIQUE (template_id, generated_date)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Class Templates
CREATE INDEX idx_class_templates_organization ON class_templates(organization_id);
CREATE INDEX idx_class_templates_active ON class_templates(organization_id, is_active);
CREATE INDEX idx_class_templates_day ON class_templates(organization_id, day_of_week);

-- Class Generation Log
CREATE INDEX idx_class_generation_log_organization ON class_generation_log(organization_id);
CREATE INDEX idx_class_generation_log_template ON class_generation_log(template_id);
CREATE INDEX idx_class_generation_log_date ON class_generation_log(generated_date);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp for class_templates
CREATE TRIGGER update_class_templates_updated_at
  BEFORE UPDATE ON class_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- ENABLE RLS
-- =============================================================================

ALTER TABLE class_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_generation_log ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES - CLASS TEMPLATES
-- =============================================================================

-- Users can view templates in their organization
CREATE POLICY "Users can view org class_templates"
  ON class_templates FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Admins can create templates
CREATE POLICY "Admins can insert class_templates"
  ON class_templates FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id() AND is_admin_or_owner());

-- Admins can update templates
CREATE POLICY "Admins can update class_templates"
  ON class_templates FOR UPDATE
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

-- Admins can delete templates
CREATE POLICY "Admins can delete class_templates"
  ON class_templates FOR DELETE
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES - CLASS GENERATION LOG
-- =============================================================================

-- Users can view generation logs in their organization
CREATE POLICY "Users can view org class_generation_log"
  ON class_generation_log FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Admins can create generation log entries
CREATE POLICY "Admins can insert class_generation_log"
  ON class_generation_log FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id() AND is_admin_or_owner());

-- Admins can delete generation log entries
CREATE POLICY "Admins can delete class_generation_log"
  ON class_generation_log FOR DELETE
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());
