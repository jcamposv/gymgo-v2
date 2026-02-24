-- =============================================================================
-- TRAINING PROGRAMS - Multi-day workout programs with completion tracking
-- =============================================================================

-- =============================================================================
-- 1. ADD PROGRAM COLUMNS TO WORKOUTS TABLE
-- =============================================================================

-- program_id: References parent program (NULL = standalone routine or parent program)
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES workouts(id) ON DELETE CASCADE;

-- day_number: Which day in the program (1-6)
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS day_number INTEGER CHECK (day_number IS NULL OR (day_number BETWEEN 1 AND 6));

-- duration_weeks: Total program duration (4, 6, 8, or 12 weeks)
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS duration_weeks INTEGER CHECK (duration_weeks IS NULL OR duration_weeks IN (4, 6, 8, 12));

-- days_per_week: Training days per week (2-6)
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS days_per_week INTEGER CHECK (days_per_week IS NULL OR (days_per_week BETWEEN 2 AND 6));

-- program_start_date: When the member started this program
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS program_start_date DATE;

-- =============================================================================
-- 2. CREATE INDEXES FOR PROGRAM QUERIES
-- =============================================================================

-- Index for finding program days
CREATE INDEX IF NOT EXISTS idx_workouts_program_id ON workouts(program_id);

-- Index for finding member's active program
CREATE INDEX IF NOT EXISTS idx_workouts_member_program ON workouts(assigned_to_member_id, program_id)
  WHERE program_id IS NOT NULL;

-- Index for finding parent programs
CREATE INDEX IF NOT EXISTS idx_workouts_parent_programs ON workouts(organization_id, assigned_to_member_id, is_active)
  WHERE program_id IS NULL AND days_per_week IS NOT NULL;

-- =============================================================================
-- 3. CREATE WORKOUT COMPLETIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS workout_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Completion info
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Program context
  program_week INTEGER, -- Which week of the program this completion is for

  -- Workout metadata
  duration_minutes INTEGER,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate completions on same day
  CONSTRAINT unique_completion_per_day UNIQUE (workout_id, member_id, completed_date)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_completions_member ON workout_completions(member_id);
CREATE INDEX IF NOT EXISTS idx_completions_member_date ON workout_completions(member_id, completed_date DESC);
CREATE INDEX IF NOT EXISTS idx_completions_workout ON workout_completions(workout_id);
CREATE INDEX IF NOT EXISTS idx_completions_org ON workout_completions(organization_id);

-- =============================================================================
-- 4. RLS POLICIES FOR WORKOUT COMPLETIONS
-- =============================================================================

ALTER TABLE workout_completions ENABLE ROW LEVEL SECURITY;

-- Members can view their own completions
CREATE POLICY "Members can view own completions" ON workout_completions
  FOR SELECT
  USING (member_id IN (SELECT id FROM members WHERE profile_id = auth.uid()));

-- Members can create their own completions
CREATE POLICY "Members can create own completions" ON workout_completions
  FOR INSERT
  WITH CHECK (member_id IN (SELECT id FROM members WHERE profile_id = auth.uid()));

-- Staff can view all completions in their organization
CREATE POLICY "Staff can view org completions" ON workout_completions
  FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Staff can manage completions in their organization
CREATE POLICY "Staff can manage org completions" ON workout_completions
  FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin', 'instructor')
    )
  );

-- =============================================================================
-- 5. TRIGGER FOR UPDATED_AT (if needed for future updates)
-- =============================================================================

-- The workout_completions table doesn't have updated_at, but adding trigger for workouts update
-- to ensure updated_at is set when program fields change (already exists from initial schema)

-- =============================================================================
-- 6. COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN workouts.program_id IS 'References parent program. NULL = standalone routine or this IS the parent program';
COMMENT ON COLUMN workouts.day_number IS 'Day number in program (1-6). Only set for program day records';
COMMENT ON COLUMN workouts.duration_weeks IS 'Total program duration in weeks. Only set for parent program records';
COMMENT ON COLUMN workouts.days_per_week IS 'Training days per week. Only set for parent program records';
COMMENT ON COLUMN workouts.program_start_date IS 'When member started this program. Set when program is assigned';

COMMENT ON TABLE workout_completions IS 'Tracks individual workout completions for progress tracking';
COMMENT ON COLUMN workout_completions.program_week IS 'Which week of the program this completion counts toward';
