-- =============================================================================
-- EXERCISE BENCHMARKS / PERSONAL RECORDS (PRs)
-- Migration to add exercise performance tracking for members
-- =============================================================================

-- =============================================================================
-- 1. BENCHMARK UNIT TYPE ENUM
-- =============================================================================

CREATE TYPE benchmark_unit AS ENUM (
  'kg',          -- Weight in kilograms
  'lbs',         -- Weight in pounds
  'reps',        -- Repetitions
  'seconds',     -- Time in seconds
  'minutes',     -- Time in minutes
  'meters',      -- Distance in meters
  'calories',    -- Calories burned
  'rounds'       -- Rounds completed (e.g., AMRAP)
);

-- =============================================================================
-- 2. EXERCISE BENCHMARKS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS exercise_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,

  -- Performance data
  value DECIMAL(10, 2) NOT NULL,           -- The benchmark value (weight, reps, time, etc.)
  unit benchmark_unit NOT NULL,            -- Unit of measurement

  -- Optional context
  reps INTEGER,                            -- Reps at this weight (e.g., 5RM)
  sets INTEGER,                            -- Sets performed
  rpe DECIMAL(3, 1),                       -- Rate of Perceived Exertion (1-10)

  -- When the benchmark was achieved
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Additional info
  notes TEXT,
  is_pr BOOLEAN DEFAULT false,             -- Is this a personal record?

  -- Who recorded this
  recorded_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 3. INDEXES
-- =============================================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_exercise_benchmarks_member_id
  ON exercise_benchmarks(member_id);
CREATE INDEX IF NOT EXISTS idx_exercise_benchmarks_organization_id
  ON exercise_benchmarks(organization_id);
CREATE INDEX IF NOT EXISTS idx_exercise_benchmarks_exercise_id
  ON exercise_benchmarks(exercise_id);

-- For fetching PR history sorted by date
CREATE INDEX IF NOT EXISTS idx_exercise_benchmarks_achieved_at
  ON exercise_benchmarks(achieved_at DESC);

-- Composite index for fetching member's benchmarks for a specific exercise
CREATE INDEX IF NOT EXISTS idx_exercise_benchmarks_member_exercise
  ON exercise_benchmarks(member_id, exercise_id, achieved_at DESC);

-- For finding PRs
CREATE INDEX IF NOT EXISTS idx_exercise_benchmarks_is_pr
  ON exercise_benchmarks(member_id, exercise_id, is_pr) WHERE is_pr = true;

-- =============================================================================
-- 4. TRIGGER FOR UPDATED_AT
-- =============================================================================

CREATE TRIGGER update_exercise_benchmarks_updated_at
  BEFORE UPDATE ON exercise_benchmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 5. FUNCTION TO AUTOMATICALLY SET IS_PR FLAG
-- =============================================================================

CREATE OR REPLACE FUNCTION set_benchmark_pr_flag()
RETURNS TRIGGER AS $$
DECLARE
  max_value DECIMAL(10, 2);
  pr_direction TEXT;
BEGIN
  -- Determine if higher or lower is better based on unit
  -- Higher is better: kg, lbs, reps, meters, calories, rounds
  -- Lower is better: seconds, minutes (for time-based exercises)
  IF NEW.unit IN ('seconds', 'minutes') THEN
    pr_direction := 'lower';
  ELSE
    pr_direction := 'higher';
  END IF;

  -- Get the current max/min value for this member/exercise combination
  IF pr_direction = 'higher' THEN
    SELECT MAX(value) INTO max_value
    FROM exercise_benchmarks
    WHERE member_id = NEW.member_id
      AND organization_id = NEW.organization_id
      AND exercise_id = NEW.exercise_id
      AND unit = NEW.unit
      AND id != NEW.id;

    -- If no previous record or new value is higher, it's a PR
    NEW.is_pr := (max_value IS NULL OR NEW.value > max_value);
  ELSE
    SELECT MIN(value) INTO max_value
    FROM exercise_benchmarks
    WHERE member_id = NEW.member_id
      AND organization_id = NEW.organization_id
      AND exercise_id = NEW.exercise_id
      AND unit = NEW.unit
      AND id != NEW.id;

    -- If no previous record or new value is lower, it's a PR
    NEW.is_pr := (max_value IS NULL OR NEW.value < max_value);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set PR flag on insert
CREATE TRIGGER set_exercise_benchmark_pr_flag
  BEFORE INSERT ON exercise_benchmarks
  FOR EACH ROW
  EXECUTE FUNCTION set_benchmark_pr_flag();

-- =============================================================================
-- 6. RLS POLICIES
-- =============================================================================

ALTER TABLE exercise_benchmarks ENABLE ROW LEVEL SECURITY;

-- Users can view benchmarks in their organization
CREATE POLICY "Users can view org exercise benchmarks"
  ON exercise_benchmarks FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Staff can insert benchmarks
CREATE POLICY "Staff can insert exercise benchmarks"
  ON exercise_benchmarks FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND (is_admin_or_owner() OR has_role('instructor'))
  );

-- Staff can update benchmarks they recorded
CREATE POLICY "Staff can update exercise benchmarks"
  ON exercise_benchmarks FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND (recorded_by_id = auth.uid() OR is_admin_or_owner())
  );

-- Admins can delete benchmarks
CREATE POLICY "Admins can delete exercise benchmarks"
  ON exercise_benchmarks FOR DELETE
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

-- =============================================================================
-- 7. COMMENTS
-- =============================================================================

COMMENT ON TABLE exercise_benchmarks IS 'Stores exercise performance records (PRs/benchmarks) for gym members';
COMMENT ON COLUMN exercise_benchmarks.value IS 'The numeric value of the benchmark (weight, reps, time, etc.)';
COMMENT ON COLUMN exercise_benchmarks.unit IS 'Unit of measurement for the value';
COMMENT ON COLUMN exercise_benchmarks.reps IS 'Number of reps at this weight (e.g., for 5RM)';
COMMENT ON COLUMN exercise_benchmarks.rpe IS 'Rate of Perceived Exertion (1-10 scale)';
COMMENT ON COLUMN exercise_benchmarks.is_pr IS 'Whether this entry represents a personal record';
