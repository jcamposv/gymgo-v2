-- Migration: Fix consume_ai_tokens table name bug
-- The function was incorrectly referencing 'ai_request_log' instead of 'ai_usage_log'

-- Drop the existing function and recreate with the correct table name
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

  -- Log the request (FIXED: correct table name is ai_usage_log)
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
