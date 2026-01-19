-- ============================================================================
-- Migration: 015_ai_module.sql
-- Description: AI Alternatives Engine - Phase 0 & 1 Setup
-- Features:
--   1. Add movement_pattern to exercises for better matching
--   2. Organization AI usage tracking (tokens/limits)
--   3. Organization equipment configuration
--   4. AI alternatives cache
-- ============================================================================

-- ============================================================================
-- 1. EXTEND EXERCISES TABLE
-- ============================================================================

-- Add movement_pattern column for better alternative matching
-- Values: horizontal_push, horizontal_pull, vertical_push, vertical_pull,
--         squat, hinge, lunge, carry, rotation, isolation, core
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS movement_pattern TEXT;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_exercises_movement_pattern
ON exercises(movement_pattern) WHERE movement_pattern IS NOT NULL;

-- Add composite index for alternatives query
CREATE INDEX IF NOT EXISTS idx_exercises_alternatives
ON exercises(is_active, difficulty)
WHERE is_active = true;

COMMENT ON COLUMN exercises.movement_pattern IS
'Movement pattern for AI alternatives matching: horizontal_push, horizontal_pull, vertical_push, vertical_pull, squat, hinge, lunge, carry, rotation, isolation, core';

-- ============================================================================
-- 2. ORGANIZATION AI USAGE TRACKING
-- ============================================================================

-- AI Plan types
CREATE TYPE ai_plan_tier AS ENUM ('free', 'pro', 'business', 'enterprise');

-- Main AI usage tracking table
CREATE TABLE IF NOT EXISTS organization_ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Plan configuration
  ai_plan ai_plan_tier NOT NULL DEFAULT 'free',
  monthly_token_limit INT NOT NULL DEFAULT 500,
  monthly_request_limit INT NOT NULL DEFAULT 50,

  -- Current period usage
  tokens_used_this_period INT NOT NULL DEFAULT 0,
  requests_this_period INT NOT NULL DEFAULT 0,

  -- Period tracking
  period_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 month'),

  -- Alerts
  alert_threshold_percent INT NOT NULL DEFAULT 80,
  alert_sent BOOLEAN NOT NULL DEFAULT FALSE,
  limit_reached_at TIMESTAMPTZ,

  -- Feature toggles
  ai_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  max_requests_per_user_daily INT DEFAULT 10,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one record per org
  UNIQUE(organization_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_org_ai_usage_org
ON organization_ai_usage(organization_id);

-- Function to auto-create AI usage record for new organizations
CREATE OR REPLACE FUNCTION create_org_ai_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organization_ai_usage (organization_id)
  VALUES (NEW.id)
  ON CONFLICT (organization_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create AI usage record when org is created
DROP TRIGGER IF EXISTS trigger_create_org_ai_usage ON organizations;
CREATE TRIGGER trigger_create_org_ai_usage
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_org_ai_usage();

-- ============================================================================
-- 3. AI USAGE LOG (for analytics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Request details
  feature TEXT NOT NULL, -- 'alternatives', 'routine_generator', etc.
  exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,

  -- Token tracking
  tokens_used INT NOT NULL DEFAULT 0,
  was_cached BOOLEAN NOT NULL DEFAULT FALSE,

  -- Response info
  response_time_ms INT,
  alternatives_count INT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_org_date
ON ai_usage_log(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_feature
ON ai_usage_log(feature, created_at DESC);

-- ============================================================================
-- 4. ORGANIZATION EQUIPMENT CONFIGURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Equipment available at this gym
  -- Array of equipment types matching exercises.equipment values
  available_equipment TEXT[] NOT NULL DEFAULT ARRAY[
    'barbell', 'dumbbell', 'kettlebell', 'cable', 'machine',
    'bodyweight', 'bench', 'pull_up_bar'
  ]::TEXT[],

  -- Optional: equipment that is temporarily unavailable
  unavailable_equipment TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(organization_id)
);

-- Auto-create equipment record for new organizations
CREATE OR REPLACE FUNCTION create_org_equipment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organization_equipment (organization_id)
  VALUES (NEW.id)
  ON CONFLICT (organization_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_org_equipment ON organizations;
CREATE TRIGGER trigger_create_org_equipment
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_org_equipment();

-- ============================================================================
-- 5. AI ALTERNATIVES CACHE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_alternatives_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cache key components
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  equipment_hash TEXT NOT NULL, -- MD5 hash of sorted equipment array
  difficulty_filter TEXT, -- null means "any"

  -- Cached response
  alternatives JSONB NOT NULL, -- Array of {exerciseId, reason, score}

  -- Cache metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  hit_count INT NOT NULL DEFAULT 0,
  last_hit_at TIMESTAMPTZ,

  -- Unique constraint for cache key
  UNIQUE(exercise_id, equipment_hash, difficulty_filter)
);

-- Index for cache lookups (removed partial index with NOW() - not immutable)
CREATE INDEX IF NOT EXISTS idx_ai_cache_lookup
ON ai_alternatives_cache(exercise_id, equipment_hash, difficulty_filter);

-- Index for cache cleanup by expiration
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires
ON ai_alternatives_cache(expires_at);

-- Function to clean expired cache entries (run periodically)
CREATE OR REPLACE FUNCTION cleanup_ai_cache()
RETURNS INT AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM ai_alternatives_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE organization_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_alternatives_cache ENABLE ROW LEVEL SECURITY;

-- Organization AI Usage policies
CREATE POLICY "Users can view their org AI usage"
ON organization_ai_usage FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can update their org AI usage"
ON organization_ai_usage FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner')
  )
);

-- AI Usage Log policies
CREATE POLICY "Users can view their org AI logs"
ON ai_usage_log FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "System can insert AI logs"
ON ai_usage_log FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- Organization Equipment policies
CREATE POLICY "Users can view their org equipment"
ON organization_equipment FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can update their org equipment"
ON organization_equipment FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner', 'assistant')
  )
);

-- AI Cache policies (read for all authenticated, managed by system)
CREATE POLICY "Anyone can read cache"
ON ai_alternatives_cache FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can manage cache"
ON ai_alternatives_cache FOR ALL
TO authenticated
USING (true);

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if org has AI tokens available
CREATE OR REPLACE FUNCTION check_ai_tokens_available(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  usage_record organization_ai_usage%ROWTYPE;
BEGIN
  SELECT * INTO usage_record
  FROM organization_ai_usage
  WHERE organization_id = org_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check if AI is enabled
  IF NOT usage_record.ai_enabled THEN
    RETURN FALSE;
  END IF;

  -- Check if within limits
  IF usage_record.requests_this_period >= usage_record.monthly_request_limit THEN
    RETURN FALSE;
  END IF;

  IF usage_record.tokens_used_this_period >= usage_record.monthly_token_limit THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to consume AI tokens
CREATE OR REPLACE FUNCTION consume_ai_tokens(
  org_id UUID,
  tokens_to_consume INT,
  feature_name TEXT,
  user_uuid UUID DEFAULT NULL,
  exercise_uuid UUID DEFAULT NULL,
  was_cache_hit BOOLEAN DEFAULT FALSE,
  response_ms INT DEFAULT NULL,
  alt_count INT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  usage_record organization_ai_usage%ROWTYPE;
BEGIN
  -- Get current usage
  SELECT * INTO usage_record
  FROM organization_ai_usage
  WHERE organization_id = org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check if period needs reset
  IF CURRENT_DATE > usage_record.period_end_date THEN
    UPDATE organization_ai_usage
    SET
      tokens_used_this_period = tokens_to_consume,
      requests_this_period = 1,
      period_start_date = CURRENT_DATE,
      period_end_date = CURRENT_DATE + INTERVAL '1 month',
      alert_sent = FALSE,
      limit_reached_at = NULL,
      updated_at = NOW()
    WHERE organization_id = org_id;
  ELSE
    -- Update usage
    UPDATE organization_ai_usage
    SET
      tokens_used_this_period = tokens_used_this_period + tokens_to_consume,
      requests_this_period = requests_this_period + 1,
      updated_at = NOW(),
      limit_reached_at = CASE
        WHEN requests_this_period + 1 >= monthly_request_limit THEN NOW()
        ELSE limit_reached_at
      END
    WHERE organization_id = org_id;
  END IF;

  -- Log the usage
  INSERT INTO ai_usage_log (
    organization_id, user_id, feature, exercise_id,
    tokens_used, was_cached, response_time_ms, alternatives_count
  ) VALUES (
    org_id, user_uuid, feature_name, exercise_uuid,
    tokens_to_consume, was_cache_hit, response_ms, alt_count
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get AI usage summary
CREATE OR REPLACE FUNCTION get_ai_usage_summary(org_id UUID)
RETURNS TABLE (
  plan ai_plan_tier,
  tokens_used INT,
  tokens_limit INT,
  tokens_percent NUMERIC,
  requests_used INT,
  requests_limit INT,
  requests_percent NUMERIC,
  days_remaining INT,
  ai_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.ai_plan,
    u.tokens_used_this_period,
    u.monthly_token_limit,
    ROUND((u.tokens_used_this_period::NUMERIC / NULLIF(u.monthly_token_limit, 0)) * 100, 1),
    u.requests_this_period,
    u.monthly_request_limit,
    ROUND((u.requests_this_period::NUMERIC / NULLIF(u.monthly_request_limit, 0)) * 100, 1),
    (u.period_end_date - CURRENT_DATE)::INT,
    u.ai_enabled
  FROM organization_ai_usage u
  WHERE u.organization_id = org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. INITIALIZE EXISTING ORGANIZATIONS
-- ============================================================================

-- Create AI usage records for existing orgs that don't have one
INSERT INTO organization_ai_usage (organization_id)
SELECT id FROM organizations
WHERE id NOT IN (SELECT organization_id FROM organization_ai_usage)
ON CONFLICT (organization_id) DO NOTHING;

-- Create equipment records for existing orgs that don't have one
INSERT INTO organization_equipment (organization_id)
SELECT id FROM organizations
WHERE id NOT IN (SELECT organization_id FROM organization_equipment)
ON CONFLICT (organization_id) DO NOTHING;

-- ============================================================================
-- 9. COMMENTS
-- ============================================================================

COMMENT ON TABLE organization_ai_usage IS 'Tracks AI feature usage and limits per organization';
COMMENT ON TABLE ai_usage_log IS 'Detailed log of AI feature usage for analytics';
COMMENT ON TABLE organization_equipment IS 'Equipment configuration per gym for filtering alternatives';
COMMENT ON TABLE ai_alternatives_cache IS 'Cached AI alternative suggestions to reduce API costs';
