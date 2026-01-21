-- =============================================================================
-- USAGE TRACKING TABLES
-- Track monthly usage for WhatsApp, Emails, Storage, and API
-- =============================================================================

-- =============================================================================
-- WHATSAPP USAGE TRACKING
-- =============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Period tracking (monthly)
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,

  -- Usage counters
  messages_sent INTEGER DEFAULT 0,
  messages_delivered INTEGER DEFAULT 0,
  messages_failed INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint per org per month
  UNIQUE(organization_id, year, month)
);

CREATE INDEX idx_whatsapp_usage_org_period ON whatsapp_usage(organization_id, year, month);

-- =============================================================================
-- EMAIL USAGE TRACKING
-- =============================================================================

CREATE TABLE IF NOT EXISTS email_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Period tracking (monthly)
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,

  -- Usage counters
  emails_sent INTEGER DEFAULT 0,
  emails_delivered INTEGER DEFAULT 0,
  emails_bounced INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint per org per month
  UNIQUE(organization_id, year, month)
);

CREATE INDEX idx_email_usage_org_period ON email_usage(organization_id, year, month);

-- =============================================================================
-- STORAGE USAGE TRACKING
-- =============================================================================

CREATE TABLE IF NOT EXISTS storage_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Usage in bytes
  total_bytes BIGINT DEFAULT 0,

  -- Breakdown by type
  images_bytes BIGINT DEFAULT 0,
  documents_bytes BIGINT DEFAULT 0,
  other_bytes BIGINT DEFAULT 0,

  -- File counts
  total_files INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One record per org
  UNIQUE(organization_id)
);

-- =============================================================================
-- API USAGE TRACKING (Daily)
-- =============================================================================

CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Period tracking (daily)
  usage_date DATE NOT NULL,

  -- Usage counters
  requests_count INTEGER DEFAULT 0,

  -- Breakdown by endpoint type
  read_requests INTEGER DEFAULT 0,
  write_requests INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint per org per day
  UNIQUE(organization_id, usage_date)
);

CREATE INDEX idx_api_usage_org_date ON api_usage(organization_id, usage_date);

-- =============================================================================
-- RPC: Consume WhatsApp Message
-- =============================================================================

CREATE OR REPLACE FUNCTION consume_whatsapp_message(
  p_organization_id UUID,
  p_count INTEGER DEFAULT 1
)
RETURNS TABLE(success BOOLEAN, remaining INTEGER, limit_reached BOOLEAN) AS $$
DECLARE
  v_current_year INTEGER := EXTRACT(YEAR FROM NOW())::INTEGER;
  v_current_month INTEGER := EXTRACT(MONTH FROM NOW())::INTEGER;
  v_current_usage INTEGER;
  v_monthly_limit INTEGER;
  v_plan TEXT;
BEGIN
  -- Get org plan and calculate limit
  SELECT subscription_plan INTO v_plan
  FROM organizations WHERE id = p_organization_id;

  -- Set limit based on plan
  v_monthly_limit := CASE v_plan
    WHEN 'starter' THEN 50
    WHEN 'growth' THEN 500
    WHEN 'pro' THEN 2000
    WHEN 'enterprise' THEN 999999
    ELSE 50
  END;

  -- Upsert usage record
  INSERT INTO whatsapp_usage (organization_id, year, month, messages_sent)
  VALUES (p_organization_id, v_current_year, v_current_month, p_count)
  ON CONFLICT (organization_id, year, month)
  DO UPDATE SET
    messages_sent = whatsapp_usage.messages_sent + p_count,
    updated_at = NOW()
  RETURNING messages_sent INTO v_current_usage;

  -- Return results
  RETURN QUERY SELECT
    v_current_usage <= v_monthly_limit AS success,
    GREATEST(0, v_monthly_limit - v_current_usage) AS remaining,
    v_current_usage >= v_monthly_limit AS limit_reached;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- RPC: Check WhatsApp Remaining
-- =============================================================================

CREATE OR REPLACE FUNCTION get_whatsapp_remaining(p_organization_id UUID)
RETURNS TABLE(used INTEGER, remaining INTEGER, monthly_limit INTEGER) AS $$
DECLARE
  v_current_year INTEGER := EXTRACT(YEAR FROM NOW())::INTEGER;
  v_current_month INTEGER := EXTRACT(MONTH FROM NOW())::INTEGER;
  v_current_usage INTEGER;
  v_monthly_limit INTEGER;
  v_plan TEXT;
BEGIN
  -- Get org plan
  SELECT subscription_plan INTO v_plan
  FROM organizations WHERE id = p_organization_id;

  -- Set limit based on plan
  v_monthly_limit := CASE v_plan
    WHEN 'starter' THEN 50
    WHEN 'growth' THEN 500
    WHEN 'pro' THEN 2000
    WHEN 'enterprise' THEN 999999
    ELSE 50
  END;

  -- Get current usage
  SELECT COALESCE(messages_sent, 0) INTO v_current_usage
  FROM whatsapp_usage
  WHERE organization_id = p_organization_id
    AND year = v_current_year
    AND month = v_current_month;

  IF v_current_usage IS NULL THEN
    v_current_usage := 0;
  END IF;

  RETURN QUERY SELECT
    v_current_usage AS used,
    GREATEST(0, v_monthly_limit - v_current_usage) AS remaining,
    v_monthly_limit AS monthly_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- RPC: Consume Email
-- =============================================================================

CREATE OR REPLACE FUNCTION consume_email(
  p_organization_id UUID,
  p_count INTEGER DEFAULT 1
)
RETURNS TABLE(success BOOLEAN, remaining INTEGER, limit_reached BOOLEAN) AS $$
DECLARE
  v_current_year INTEGER := EXTRACT(YEAR FROM NOW())::INTEGER;
  v_current_month INTEGER := EXTRACT(MONTH FROM NOW())::INTEGER;
  v_current_usage INTEGER;
  v_monthly_limit INTEGER;
  v_plan TEXT;
BEGIN
  -- Get org plan
  SELECT subscription_plan INTO v_plan
  FROM organizations WHERE id = p_organization_id;

  -- Set limit based on plan
  v_monthly_limit := CASE v_plan
    WHEN 'starter' THEN 500
    WHEN 'growth' THEN 3000
    WHEN 'pro' THEN 10000
    WHEN 'enterprise' THEN 999999
    ELSE 500
  END;

  -- Upsert usage record
  INSERT INTO email_usage (organization_id, year, month, emails_sent)
  VALUES (p_organization_id, v_current_year, v_current_month, p_count)
  ON CONFLICT (organization_id, year, month)
  DO UPDATE SET
    emails_sent = email_usage.emails_sent + p_count,
    updated_at = NOW()
  RETURNING emails_sent INTO v_current_usage;

  RETURN QUERY SELECT
    v_current_usage <= v_monthly_limit AS success,
    GREATEST(0, v_monthly_limit - v_current_usage) AS remaining,
    v_current_usage >= v_monthly_limit AS limit_reached;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- RPC: Get Email Remaining
-- =============================================================================

CREATE OR REPLACE FUNCTION get_email_remaining(p_organization_id UUID)
RETURNS TABLE(used INTEGER, remaining INTEGER, monthly_limit INTEGER) AS $$
DECLARE
  v_current_year INTEGER := EXTRACT(YEAR FROM NOW())::INTEGER;
  v_current_month INTEGER := EXTRACT(MONTH FROM NOW())::INTEGER;
  v_current_usage INTEGER;
  v_monthly_limit INTEGER;
  v_plan TEXT;
BEGIN
  SELECT subscription_plan INTO v_plan
  FROM organizations WHERE id = p_organization_id;

  v_monthly_limit := CASE v_plan
    WHEN 'starter' THEN 500
    WHEN 'growth' THEN 3000
    WHEN 'pro' THEN 10000
    WHEN 'enterprise' THEN 999999
    ELSE 500
  END;

  SELECT COALESCE(emails_sent, 0) INTO v_current_usage
  FROM email_usage
  WHERE organization_id = p_organization_id
    AND year = v_current_year
    AND month = v_current_month;

  IF v_current_usage IS NULL THEN
    v_current_usage := 0;
  END IF;

  RETURN QUERY SELECT
    v_current_usage AS used,
    GREATEST(0, v_monthly_limit - v_current_usage) AS remaining,
    v_monthly_limit AS monthly_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- RPC: Check API Rate Limit (Daily)
-- =============================================================================

CREATE OR REPLACE FUNCTION check_api_rate_limit(
  p_organization_id UUID
)
RETURNS TABLE(allowed BOOLEAN, used INTEGER, remaining INTEGER, daily_limit INTEGER) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_current_usage INTEGER;
  v_daily_limit INTEGER;
  v_plan TEXT;
  v_api_access BOOLEAN;
BEGIN
  -- Get org plan
  SELECT subscription_plan INTO v_plan
  FROM organizations WHERE id = p_organization_id;

  -- Set limit and access based on plan
  v_api_access := v_plan IN ('pro', 'enterprise');
  v_daily_limit := CASE v_plan
    WHEN 'pro' THEN 1000
    WHEN 'enterprise' THEN 999999
    ELSE 0
  END;

  -- If no API access, return denied
  IF NOT v_api_access THEN
    RETURN QUERY SELECT FALSE, 0, 0, 0;
    RETURN;
  END IF;

  -- Get today's usage
  SELECT COALESCE(requests_count, 0) INTO v_current_usage
  FROM api_usage
  WHERE organization_id = p_organization_id AND usage_date = v_today;

  IF v_current_usage IS NULL THEN
    v_current_usage := 0;
  END IF;

  RETURN QUERY SELECT
    v_current_usage < v_daily_limit AS allowed,
    v_current_usage AS used,
    GREATEST(0, v_daily_limit - v_current_usage) AS remaining,
    v_daily_limit AS daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- RPC: Consume API Request
-- =============================================================================

CREATE OR REPLACE FUNCTION consume_api_request(
  p_organization_id UUID,
  p_is_write BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(success BOOLEAN, remaining INTEGER) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_current_usage INTEGER;
  v_daily_limit INTEGER;
  v_plan TEXT;
BEGIN
  -- Get org plan
  SELECT subscription_plan INTO v_plan
  FROM organizations WHERE id = p_organization_id;

  -- Check if API access allowed
  IF v_plan NOT IN ('pro', 'enterprise') THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;

  v_daily_limit := CASE v_plan
    WHEN 'pro' THEN 1000
    WHEN 'enterprise' THEN 999999
    ELSE 0
  END;

  -- Upsert usage record
  INSERT INTO api_usage (organization_id, usage_date, requests_count, read_requests, write_requests)
  VALUES (
    p_organization_id,
    v_today,
    1,
    CASE WHEN p_is_write THEN 0 ELSE 1 END,
    CASE WHEN p_is_write THEN 1 ELSE 0 END
  )
  ON CONFLICT (organization_id, usage_date)
  DO UPDATE SET
    requests_count = api_usage.requests_count + 1,
    read_requests = api_usage.read_requests + CASE WHEN p_is_write THEN 0 ELSE 1 END,
    write_requests = api_usage.write_requests + CASE WHEN p_is_write THEN 1 ELSE 0 END,
    updated_at = NOW()
  RETURNING requests_count INTO v_current_usage;

  RETURN QUERY SELECT
    v_current_usage <= v_daily_limit AS success,
    GREATEST(0, v_daily_limit - v_current_usage) AS remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- RPC: Update Storage Usage
-- =============================================================================

CREATE OR REPLACE FUNCTION update_storage_usage(
  p_organization_id UUID,
  p_bytes_change BIGINT,
  p_file_type VARCHAR(20) DEFAULT 'other'
)
RETURNS TABLE(success BOOLEAN, total_bytes BIGINT, limit_bytes BIGINT, limit_reached BOOLEAN) AS $$
DECLARE
  v_current_bytes BIGINT;
  v_limit_bytes BIGINT;
  v_plan TEXT;
BEGIN
  -- Get org plan
  SELECT subscription_plan INTO v_plan
  FROM organizations WHERE id = p_organization_id;

  -- Set limit based on plan (in bytes)
  v_limit_bytes := CASE v_plan
    WHEN 'starter' THEN 1073741824      -- 1 GB
    WHEN 'growth' THEN 5368709120       -- 5 GB
    WHEN 'pro' THEN 21474836480         -- 20 GB
    WHEN 'enterprise' THEN 107374182400 -- 100 GB
    ELSE 1073741824
  END;

  -- Upsert storage record
  INSERT INTO storage_usage (
    organization_id,
    total_bytes,
    images_bytes,
    documents_bytes,
    other_bytes,
    total_files
  )
  VALUES (
    p_organization_id,
    GREATEST(0, p_bytes_change),
    CASE WHEN p_file_type = 'image' THEN GREATEST(0, p_bytes_change) ELSE 0 END,
    CASE WHEN p_file_type = 'document' THEN GREATEST(0, p_bytes_change) ELSE 0 END,
    CASE WHEN p_file_type = 'other' THEN GREATEST(0, p_bytes_change) ELSE 0 END,
    CASE WHEN p_bytes_change > 0 THEN 1 ELSE 0 END
  )
  ON CONFLICT (organization_id)
  DO UPDATE SET
    total_bytes = GREATEST(0, storage_usage.total_bytes + p_bytes_change),
    images_bytes = GREATEST(0, storage_usage.images_bytes + CASE WHEN p_file_type = 'image' THEN p_bytes_change ELSE 0 END),
    documents_bytes = GREATEST(0, storage_usage.documents_bytes + CASE WHEN p_file_type = 'document' THEN p_bytes_change ELSE 0 END),
    other_bytes = GREATEST(0, storage_usage.other_bytes + CASE WHEN p_file_type = 'other' THEN p_bytes_change ELSE 0 END),
    total_files = storage_usage.total_files + CASE WHEN p_bytes_change > 0 THEN 1 WHEN p_bytes_change < 0 THEN -1 ELSE 0 END,
    updated_at = NOW()
  RETURNING storage_usage.total_bytes INTO v_current_bytes;

  RETURN QUERY SELECT
    v_current_bytes <= v_limit_bytes AS success,
    v_current_bytes AS total_bytes,
    v_limit_bytes AS limit_bytes,
    v_current_bytes >= v_limit_bytes AS limit_reached;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- RPC: Get Storage Remaining
-- =============================================================================

CREATE OR REPLACE FUNCTION get_storage_remaining(p_organization_id UUID)
RETURNS TABLE(used_bytes BIGINT, remaining_bytes BIGINT, limit_bytes BIGINT, used_percentage INTEGER) AS $$
DECLARE
  v_current_bytes BIGINT;
  v_limit_bytes BIGINT;
  v_plan TEXT;
BEGIN
  SELECT subscription_plan INTO v_plan
  FROM organizations WHERE id = p_organization_id;

  v_limit_bytes := CASE v_plan
    WHEN 'starter' THEN 1073741824
    WHEN 'growth' THEN 5368709120
    WHEN 'pro' THEN 21474836480
    WHEN 'enterprise' THEN 107374182400
    ELSE 1073741824
  END;

  SELECT COALESCE(total_bytes, 0) INTO v_current_bytes
  FROM storage_usage WHERE organization_id = p_organization_id;

  IF v_current_bytes IS NULL THEN
    v_current_bytes := 0;
  END IF;

  RETURN QUERY SELECT
    v_current_bytes AS used_bytes,
    GREATEST(0::BIGINT, v_limit_bytes - v_current_bytes) AS remaining_bytes,
    v_limit_bytes AS limit_bytes,
    CASE WHEN v_limit_bytes > 0
      THEN LEAST(100, (v_current_bytes * 100 / v_limit_bytes)::INTEGER)
      ELSE 0
    END AS used_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE whatsapp_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their org's usage
CREATE POLICY "Users can view own org whatsapp usage"
  ON whatsapp_usage FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view own org email usage"
  ON email_usage FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view own org storage usage"
  ON storage_usage FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view own org api usage"
  ON api_usage FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION consume_whatsapp_message TO authenticated;
GRANT EXECUTE ON FUNCTION get_whatsapp_remaining TO authenticated;
GRANT EXECUTE ON FUNCTION consume_email TO authenticated;
GRANT EXECUTE ON FUNCTION get_email_remaining TO authenticated;
GRANT EXECUTE ON FUNCTION check_api_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION consume_api_request TO authenticated;
GRANT EXECUTE ON FUNCTION update_storage_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_storage_remaining TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE whatsapp_usage IS 'Monthly WhatsApp message usage per organization';
COMMENT ON TABLE email_usage IS 'Monthly email usage per organization';
COMMENT ON TABLE storage_usage IS 'Storage usage tracking per organization';
COMMENT ON TABLE api_usage IS 'Daily API request usage per organization';
