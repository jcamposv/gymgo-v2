-- Migration: Workout Exercise Overrides
-- Allows users to substitute exercises for a specific day without modifying the routine template

-- =============================================================================
-- 1. Create workout_exercise_overrides table
-- =============================================================================

CREATE TABLE IF NOT EXISTS workout_exercise_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Reference the assigned workout/routine
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,

  -- Which exercise in the routine is being overridden (by order position)
  original_exercise_id UUID NOT NULL,
  original_exercise_order INTEGER NOT NULL,

  -- What exercise replaces it
  replacement_exercise_id UUID NOT NULL,

  -- When this override applies (specific date)
  override_date DATE NOT NULL,

  -- Who made the change
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Optional: why they swapped
  reason TEXT,

  -- Tracking
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate overrides for same exercise on same day
  CONSTRAINT unique_override_per_exercise UNIQUE (
    workout_id,
    original_exercise_order,
    override_date
  )
);

-- =============================================================================
-- 2. Indexes for performance
-- =============================================================================

-- Find all overrides for a specific workout on a date
CREATE INDEX idx_overrides_workout_date
ON workout_exercise_overrides(workout_id, override_date);

-- Find all overrides for a specific date (for batch loading)
CREATE INDEX idx_overrides_date
ON workout_exercise_overrides(override_date)
WHERE is_active = true;

-- Find overrides by member
CREATE INDEX idx_overrides_member
ON workout_exercise_overrides(member_id);

-- =============================================================================
-- 3. RLS Policies
-- =============================================================================

ALTER TABLE workout_exercise_overrides ENABLE ROW LEVEL SECURITY;

-- Members can view their own overrides
CREATE POLICY "Members can view their own overrides"
ON workout_exercise_overrides FOR SELECT
USING (
  member_id IN (
    SELECT id FROM members WHERE user_id = auth.uid()
  )
);

-- Members can create their own overrides
CREATE POLICY "Members can create their own overrides"
ON workout_exercise_overrides FOR INSERT
WITH CHECK (
  member_id IN (
    SELECT id FROM members WHERE user_id = auth.uid()
  )
);

-- Members can update their own overrides
CREATE POLICY "Members can update their own overrides"
ON workout_exercise_overrides FOR UPDATE
USING (
  member_id IN (
    SELECT id FROM members WHERE user_id = auth.uid()
  )
);

-- Service role can do everything
CREATE POLICY "Service role full access to overrides"
ON workout_exercise_overrides FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- 4. Function to get overrides for a workout on a specific date
-- =============================================================================

CREATE OR REPLACE FUNCTION get_workout_overrides(
  p_workout_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  original_exercise_order INTEGER,
  original_exercise_id UUID,
  replacement_exercise_id UUID,
  replacement_name TEXT,
  replacement_name_es TEXT,
  replacement_gif_url TEXT,
  replacement_category TEXT,
  replacement_difficulty TEXT,
  replacement_muscle_groups TEXT[],
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.original_exercise_order,
    o.original_exercise_id,
    o.replacement_exercise_id,
    e.name AS replacement_name,
    e.name_es AS replacement_name_es,
    e.gif_url AS replacement_gif_url,
    e.category AS replacement_category,
    e.difficulty AS replacement_difficulty,
    e.muscle_groups AS replacement_muscle_groups,
    o.reason
  FROM workout_exercise_overrides o
  JOIN exercises e ON e.id = o.replacement_exercise_id
  WHERE o.workout_id = p_workout_id
    AND o.override_date = p_date
    AND o.is_active = true;
END;
$$;

-- =============================================================================
-- 5. Function to substitute an exercise (upsert)
-- =============================================================================

CREATE OR REPLACE FUNCTION substitute_exercise(
  p_workout_id UUID,
  p_original_exercise_id UUID,
  p_original_exercise_order INTEGER,
  p_replacement_exercise_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member_id UUID;
  v_org_id UUID;
  v_override_id UUID;
BEGIN
  -- Get member_id from current user
  SELECT m.id, m.organization_id INTO v_member_id, v_org_id
  FROM members m
  WHERE m.user_id = auth.uid()
  LIMIT 1;

  IF v_member_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'member_not_found');
  END IF;

  -- Upsert the override (replace if exists for same exercise on same day)
  INSERT INTO workout_exercise_overrides (
    organization_id,
    workout_id,
    original_exercise_id,
    original_exercise_order,
    replacement_exercise_id,
    override_date,
    member_id,
    reason
  ) VALUES (
    v_org_id,
    p_workout_id,
    p_original_exercise_id,
    p_original_exercise_order,
    p_replacement_exercise_id,
    CURRENT_DATE,
    v_member_id,
    p_reason
  )
  ON CONFLICT (workout_id, original_exercise_order, override_date)
  DO UPDATE SET
    replacement_exercise_id = EXCLUDED.replacement_exercise_id,
    reason = EXCLUDED.reason,
    is_active = true
  RETURNING id INTO v_override_id;

  RETURN json_build_object(
    'success', true,
    'override_id', v_override_id,
    'message', 'Ejercicio reemplazado para hoy'
  );
END;
$$;
