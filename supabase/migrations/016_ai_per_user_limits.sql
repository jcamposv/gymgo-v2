-- Migration: AI Per-User Limits
-- Changes the AI system from per-organization to per-user limits

-- =============================================================================
-- 1. Add per-user configuration to organization_ai_usage
-- =============================================================================

ALTER TABLE organization_ai_usage
ADD COLUMN IF NOT EXISTS requests_per_user_monthly INTEGER NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS extra_requests_per_user INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_per_extra_request DECIMAL(10,4) NOT NULL DEFAULT 0.001;

-- Add comment explaining the fields
COMMENT ON COLUMN organization_ai_usage.requests_per_user_monthly IS 'Base monthly request limit per user (default 50)';
COMMENT ON COLUMN organization_ai_usage.extra_requests_per_user IS 'Additional requests purchased per user';
COMMENT ON COLUMN organization_ai_usage.cost_per_extra_request IS 'Cost per extra request in USD';

-- =============================================================================
-- 2. Create user_ai_usage table for per-user tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Monthly usage tracking
  requests_this_month INTEGER NOT NULL DEFAULT 0,
  tokens_used_this_month INTEGER NOT NULL DEFAULT 0,
  period_month DATE NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::DATE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One record per user per organization per month
  UNIQUE(user_id, organization_id, period_month)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_ai_usage_lookup
ON user_ai_usage(user_id, organization_id, period_month);

-- Enable RLS
ALTER TABLE user_ai_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own AI usage"
ON user_ai_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage user AI usage"
ON user_ai_usage FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- 3. Update consume_ai_tokens function for per-user tracking
-- =============================================================================

-- Drop existing function first (return type change requires this)
DROP FUNCTION IF EXISTS consume_ai_tokens(UUID, INTEGER, TEXT, UUID, UUID, BOOLEAN, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION consume_ai_tokens(
  org_id UUID,
  tokens_to_consume INTEGER,
  feature_name TEXT DEFAULT 'alternatives',
  user_uuid UUID DEFAULT NULL,
  exercise_uuid UUID DEFAULT NULL,
  was_cache_hit BOOLEAN DEFAULT FALSE,
  response_ms INTEGER DEFAULT NULL,
  alt_count INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_usage organization_ai_usage%ROWTYPE;
  user_usage user_ai_usage%ROWTYPE;
  current_month DATE;
  user_limit INTEGER;
  user_remaining INTEGER;
BEGIN
  current_month := date_trunc('month', CURRENT_DATE)::DATE;

  -- Get organization usage config
  SELECT * INTO org_usage
  FROM organization_ai_usage
  WHERE organization_id = org_id;

  -- Calculate user's effective limit
  user_limit := COALESCE(org_usage.requests_per_user_monthly, 50)
                + COALESCE(org_usage.extra_requests_per_user, 0);

  -- Get or create user usage record for this month
  IF user_uuid IS NOT NULL THEN
    INSERT INTO user_ai_usage (user_id, organization_id, period_month)
    VALUES (user_uuid, org_id, current_month)
    ON CONFLICT (user_id, organization_id, period_month) DO NOTHING;

    SELECT * INTO user_usage
    FROM user_ai_usage
    WHERE user_id = user_uuid
      AND organization_id = org_id
      AND period_month = current_month;

    -- Check if user has exceeded their limit
    IF user_usage.requests_this_month >= user_limit THEN
      RETURN json_build_object(
        'success', false,
        'error', 'user_limit_exceeded',
        'user_remaining', 0,
        'user_limit', user_limit
      );
    END IF;

    -- Update user usage
    UPDATE user_ai_usage
    SET
      requests_this_month = requests_this_month + 1,
      tokens_used_this_month = tokens_used_this_month + tokens_to_consume,
      updated_at = NOW()
    WHERE user_id = user_uuid
      AND organization_id = org_id
      AND period_month = current_month;

    user_remaining := user_limit - user_usage.requests_this_month - 1;
  ELSE
    user_remaining := user_limit;
  END IF;

  -- Update organization totals (for analytics/billing)
  UPDATE organization_ai_usage
  SET
    tokens_used_this_period = tokens_used_this_period + tokens_to_consume,
    requests_this_period = requests_this_period + 1,
    updated_at = NOW()
  WHERE organization_id = org_id;

  -- Log the request (table is ai_usage_log from migration 015)
  INSERT INTO ai_usage_log (
    organization_id,
    user_id,
    feature,
    exercise_id,
    tokens_used,
    was_cached,
    response_time_ms,
    alternatives_count
  ) VALUES (
    org_id,
    user_uuid,
    feature_name,
    exercise_uuid,
    tokens_to_consume,
    was_cache_hit,
    response_ms,
    alt_count
  );

  RETURN json_build_object(
    'success', true,
    'user_remaining', user_remaining,
    'user_limit', user_limit,
    'tokens_consumed', tokens_to_consume
  );
END;
$$;

-- =============================================================================
-- 4. Function to check user's remaining requests (for pre-check)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_ai_remaining(
  user_uuid UUID,
  org_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_usage organization_ai_usage%ROWTYPE;
  user_usage user_ai_usage%ROWTYPE;
  current_month DATE;
  user_limit INTEGER;
  user_used INTEGER;
BEGIN
  current_month := date_trunc('month', CURRENT_DATE)::DATE;

  -- Get organization config
  SELECT * INTO org_usage
  FROM organization_ai_usage
  WHERE organization_id = org_id;

  IF org_usage IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'organization_not_found'
    );
  END IF;

  -- Calculate limit
  user_limit := COALESCE(org_usage.requests_per_user_monthly, 50)
                + COALESCE(org_usage.extra_requests_per_user, 0);

  -- Get user's current usage
  SELECT * INTO user_usage
  FROM user_ai_usage
  WHERE user_id = user_uuid
    AND organization_id = org_id
    AND period_month = current_month;

  user_used := COALESCE(user_usage.requests_this_month, 0);

  RETURN json_build_object(
    'success', true,
    'limit', user_limit,
    'used', user_used,
    'remaining', GREATEST(0, user_limit - user_used),
    'ai_enabled', org_usage.ai_enabled
  );
END;
$$;

-- =============================================================================
-- 5. Function for gym admin to update per-user limits
-- =============================================================================

CREATE OR REPLACE FUNCTION update_ai_user_limits(
  org_id UUID,
  new_base_limit INTEGER DEFAULT NULL,
  new_extra_requests INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_row organization_ai_usage%ROWTYPE;
BEGIN
  UPDATE organization_ai_usage
  SET
    requests_per_user_monthly = COALESCE(new_base_limit, requests_per_user_monthly),
    extra_requests_per_user = COALESCE(new_extra_requests, extra_requests_per_user),
    updated_at = NOW()
  WHERE organization_id = org_id
  RETURNING * INTO updated_row;

  IF updated_row IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'organization_not_found');
  END IF;

  RETURN json_build_object(
    'success', true,
    'requests_per_user_monthly', updated_row.requests_per_user_monthly,
    'extra_requests_per_user', updated_row.extra_requests_per_user,
    'total_per_user', updated_row.requests_per_user_monthly + updated_row.extra_requests_per_user
  );
END;
$$;
