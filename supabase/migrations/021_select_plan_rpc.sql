-- =============================================================================
-- RPC Function to select subscription plan
-- This bypasses PostgREST schema cache issues
-- =============================================================================

CREATE OR REPLACE FUNCTION select_subscription_plan(
  p_organization_id UUID,
  p_plan subscription_plan,
  p_billing_period VARCHAR(20),
  p_trial_ends_at TIMESTAMPTZ,
  p_max_members INTEGER,
  p_max_locations INTEGER,
  p_max_admin_users INTEGER,
  p_features JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE organizations
  SET
    subscription_plan = p_plan,
    subscription_status = 'trial',
    billing_period = p_billing_period,
    trial_ends_at = p_trial_ends_at,
    max_members = p_max_members,
    max_locations = p_max_locations,
    max_admin_users = p_max_admin_users,
    features = p_features,
    updated_at = NOW()
  WHERE id = p_organization_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION select_subscription_plan TO authenticated;

-- Comment
COMMENT ON FUNCTION select_subscription_plan IS 'Updates organization subscription plan - bypasses PostgREST cache';
