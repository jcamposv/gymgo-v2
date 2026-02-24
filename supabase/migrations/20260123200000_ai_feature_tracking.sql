-- =============================================================================
-- AI Feature-Specific Usage Tracking
-- =============================================================================
-- This migration adds feature-specific counters to track:
-- - routine_generations_used
-- - exercise_alternatives_used
-- And updates the consume_ai_tokens RPC to track by feature type
-- =============================================================================

-- Add feature-specific columns to organization_ai_usage
ALTER TABLE organization_ai_usage
ADD COLUMN IF NOT EXISTS routine_generations_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS exercise_alternatives_used INTEGER DEFAULT 0;

-- Add feature-specific columns to user_ai_usage
ALTER TABLE user_ai_usage
ADD COLUMN IF NOT EXISTS routine_generations_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS exercise_alternatives_used INTEGER DEFAULT 0;

-- =============================================================================
-- Update consume_ai_tokens RPC to track feature-specific usage
-- =============================================================================

CREATE OR REPLACE FUNCTION consume_ai_tokens(
  org_id UUID,
  tokens_to_consume INTEGER,
  feature_name TEXT DEFAULT 'alternatives',
  user_uuid UUID DEFAULT NULL,
  exercise_uuid UUID DEFAULT NULL,
  was_cache_hit BOOLEAN DEFAULT FALSE,
  response_ms INTEGER DEFAULT 0,
  alt_count INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usage_record organization_ai_usage%ROWTYPE;
  v_user_usage user_ai_usage%ROWTYPE;
  v_current_month DATE;
  v_user_remaining INTEGER;
  v_user_limit INTEGER;
  v_org_remaining INTEGER;
  v_org_limit INTEGER;
BEGIN
  v_current_month := date_trunc('month', CURRENT_DATE)::DATE;

  -- Get or create org usage record
  SELECT * INTO v_usage_record
  FROM organization_ai_usage
  WHERE organization_id = org_id;

  IF NOT FOUND THEN
    INSERT INTO organization_ai_usage (
      organization_id,
      period_start_date,
      period_end_date
    ) VALUES (
      org_id,
      v_current_month,
      (v_current_month + INTERVAL '1 month')::DATE
    )
    RETURNING * INTO v_usage_record;
  END IF;

  -- Check if period needs reset
  IF v_usage_record.period_end_date <= CURRENT_DATE THEN
    UPDATE organization_ai_usage SET
      tokens_used_this_period = 0,
      requests_this_period = 0,
      routine_generations_used = 0,
      exercise_alternatives_used = 0,
      period_start_date = v_current_month,
      period_end_date = (v_current_month + INTERVAL '1 month')::DATE,
      alert_sent = FALSE,
      limit_reached_at = NULL
    WHERE organization_id = org_id
    RETURNING * INTO v_usage_record;
  END IF;

  -- Update org usage counters
  UPDATE organization_ai_usage SET
    tokens_used_this_period = tokens_used_this_period + tokens_to_consume,
    requests_this_period = requests_this_period + 1,
    routine_generations_used = CASE
      WHEN feature_name = 'routine_generation' THEN routine_generations_used + 1
      ELSE routine_generations_used
    END,
    exercise_alternatives_used = CASE
      WHEN feature_name = 'alternatives' THEN exercise_alternatives_used + 1
      ELSE exercise_alternatives_used
    END,
    updated_at = NOW()
  WHERE organization_id = org_id
  RETURNING * INTO v_usage_record;

  -- Calculate org remaining
  v_org_limit := COALESCE(v_usage_record.monthly_request_limit, 50);
  v_org_remaining := GREATEST(0, v_org_limit - v_usage_record.requests_this_period);

  -- Handle per-user tracking if user_uuid provided
  IF user_uuid IS NOT NULL THEN
    -- Get or create user usage record for this month
    SELECT * INTO v_user_usage
    FROM user_ai_usage
    WHERE user_id = user_uuid
      AND organization_id = org_id
      AND period_month = v_current_month;

    IF NOT FOUND THEN
      INSERT INTO user_ai_usage (
        user_id,
        organization_id,
        period_month,
        requests_this_month,
        tokens_used_this_month,
        routine_generations_used,
        exercise_alternatives_used
      ) VALUES (
        user_uuid,
        org_id,
        v_current_month,
        0,
        0,
        0,
        0
      )
      RETURNING * INTO v_user_usage;
    END IF;

    -- Update user usage
    UPDATE user_ai_usage SET
      requests_this_month = requests_this_month + 1,
      tokens_used_this_month = tokens_used_this_month + tokens_to_consume,
      routine_generations_used = CASE
        WHEN feature_name = 'routine_generation' THEN routine_generations_used + 1
        ELSE routine_generations_used
      END,
      exercise_alternatives_used = CASE
        WHEN feature_name = 'alternatives' THEN exercise_alternatives_used + 1
        ELSE exercise_alternatives_used
      END,
      updated_at = NOW()
    WHERE user_id = user_uuid
      AND organization_id = org_id
      AND period_month = v_current_month
    RETURNING * INTO v_user_usage;

    -- Calculate user limits
    v_user_limit := COALESCE(
      v_usage_record.requests_per_user_monthly,
      50
    ) + COALESCE(v_usage_record.extra_requests_per_user, 0);

    v_user_remaining := GREATEST(0, v_user_limit - v_user_usage.requests_this_month);
  ELSE
    v_user_remaining := v_org_remaining;
    v_user_limit := v_org_limit;
  END IF;

  -- Log the usage
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
    'success', TRUE,
    'user_remaining', v_user_remaining,
    'user_limit', v_user_limit,
    'org_remaining', v_org_remaining,
    'org_limit', v_org_limit,
    'feature', feature_name
  );
END;
$$;

-- =============================================================================
-- Function to check AI limits by feature
-- =============================================================================

CREATE OR REPLACE FUNCTION check_ai_feature_limit(
  org_id UUID,
  user_uuid UUID,
  feature_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usage_record organization_ai_usage%ROWTYPE;
  v_user_usage user_ai_usage%ROWTYPE;
  v_current_month DATE;
  v_feature_used INTEGER;
  v_feature_limit INTEGER;
  v_general_used INTEGER;
  v_general_limit INTEGER;
  v_allowed BOOLEAN;
BEGIN
  v_current_month := date_trunc('month', CURRENT_DATE)::DATE;

  -- Get org usage
  SELECT * INTO v_usage_record
  FROM organization_ai_usage
  WHERE organization_id = org_id;

  IF NOT FOUND THEN
    -- No usage record = allowed (will be created on first use)
    RETURN json_build_object(
      'allowed', TRUE,
      'feature', feature_name,
      'feature_used', 0,
      'feature_limit', -1,
      'general_used', 0,
      'general_limit', -1
    );
  END IF;

  -- Check if period needs reset
  IF v_usage_record.period_end_date <= CURRENT_DATE THEN
    v_feature_used := 0;
    v_general_used := 0;
  ELSE
    v_general_used := COALESCE(v_usage_record.requests_this_period, 0);

    -- Get feature-specific usage
    IF feature_name = 'routine_generation' THEN
      v_feature_used := COALESCE(v_usage_record.routine_generations_used, 0);
    ELSIF feature_name = 'alternatives' THEN
      v_feature_used := COALESCE(v_usage_record.exercise_alternatives_used, 0);
    ELSE
      v_feature_used := v_general_used;
    END IF;
  END IF;

  -- These limits come from pricing.config.ts via the calling code
  -- Here we just return the current usage for the calling code to compare
  v_general_limit := COALESCE(v_usage_record.monthly_request_limit, 50);

  -- For feature limits, return -1 to indicate "check against plan limits"
  v_feature_limit := -1;

  -- AI enabled check
  v_allowed := COALESCE(v_usage_record.ai_enabled, TRUE);

  RETURN json_build_object(
    'allowed', v_allowed,
    'feature', feature_name,
    'feature_used', v_feature_used,
    'feature_limit', v_feature_limit,
    'general_used', v_general_used,
    'general_limit', v_general_limit,
    'period_end', v_usage_record.period_end_date
  );
END;
$$;

-- =============================================================================
-- Grant permissions
-- =============================================================================

GRANT EXECUTE ON FUNCTION consume_ai_tokens TO authenticated;
GRANT EXECUTE ON FUNCTION consume_ai_tokens TO service_role;
GRANT EXECUTE ON FUNCTION check_ai_feature_limit TO authenticated;
GRANT EXECUTE ON FUNCTION check_ai_feature_limit TO service_role;
