-- =============================================================================
-- SUBSCRIPTION MANAGEMENT
-- Adds trial period tracking and organization enable/disable functionality
-- =============================================================================

-- Subscription status enum
CREATE TYPE subscription_status AS ENUM (
  'trial',      -- 3-month free trial
  'active',     -- Paid and active
  'past_due',   -- Payment overdue
  'cancelled',  -- User cancelled
  'disabled'    -- Admin disabled (non-payment)
);

-- Add subscription management columns to organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS subscription_status subscription_status DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS disabled_reason TEXT,
  ADD COLUMN IF NOT EXISTS billing_period VARCHAR(20) DEFAULT 'monthly'; -- 'monthly' | 'yearly'

-- Set trial_ends_at for existing organizations (3 months from created_at)
UPDATE organizations
SET
  trial_ends_at = created_at + INTERVAL '3 months',
  subscription_status = 'trial'
WHERE trial_ends_at IS NULL;

-- Create index for finding expired trials
CREATE INDEX IF NOT EXISTS idx_organizations_trial_ends_at
  ON organizations(trial_ends_at)
  WHERE subscription_status = 'trial';

-- Create index for active status checks
CREATE INDEX IF NOT EXISTS idx_organizations_is_active
  ON organizations(is_active);

-- =============================================================================
-- FUNCTION: Check and update expired trials
-- Run this periodically (cron job) to mark expired trials
-- =============================================================================

CREATE OR REPLACE FUNCTION check_expired_trials()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE organizations
  SET
    subscription_status = 'past_due',
    updated_at = NOW()
  WHERE
    subscription_status = 'trial'
    AND trial_ends_at < NOW()
    AND is_active = true;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUNCTION: Disable organization (for non-payment)
-- =============================================================================

CREATE OR REPLACE FUNCTION disable_organization(
  org_id UUID,
  reason TEXT DEFAULT 'Non-payment after trial period'
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE organizations
  SET
    is_active = false,
    subscription_status = 'disabled',
    disabled_at = NOW(),
    disabled_reason = reason,
    updated_at = NOW()
  WHERE id = org_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUNCTION: Enable organization (after payment received)
-- =============================================================================

CREATE OR REPLACE FUNCTION enable_organization(
  org_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE organizations
  SET
    is_active = true,
    subscription_status = 'active',
    subscription_started_at = COALESCE(subscription_started_at, NOW()),
    disabled_at = NULL,
    disabled_reason = NULL,
    updated_at = NOW()
  WHERE id = org_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- SUBSCRIPTION HISTORY TABLE
-- Track plan changes and payments for audit
-- =============================================================================

CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- What changed
  event_type VARCHAR(50) NOT NULL, -- 'plan_selected', 'plan_changed', 'payment_received', 'trial_started', 'trial_ended', 'disabled', 'enabled'

  -- Plan info
  from_plan subscription_plan,
  to_plan subscription_plan,
  billing_period VARCHAR(20), -- 'monthly' | 'yearly'

  -- Payment info (for manual tracking)
  amount_usd DECIMAL(10, 2),
  payment_method VARCHAR(50), -- 'bank_transfer', 'card', 'cash', 'other'
  payment_reference VARCHAR(255),

  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_subscription_history_org
  ON subscription_history(organization_id, created_at DESC);

-- =============================================================================
-- RLS Policies for subscription_history
-- =============================================================================

ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Owners and admins can view their org's subscription history
CREATE POLICY "Users can view own org subscription history"
  ON subscription_history FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Only super admins (via service role) can insert subscription history
-- This is handled through server actions, not direct client access

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN organizations.subscription_status IS 'Current subscription status: trial (3 months free), active (paid), past_due (needs payment), cancelled, disabled';
COMMENT ON COLUMN organizations.trial_ends_at IS 'Date when 3-month free trial ends';
COMMENT ON COLUMN organizations.is_active IS 'Whether the organization can access the platform. Set to false to disable gym.';
COMMENT ON COLUMN organizations.disabled_reason IS 'Reason for disabling (e.g., non-payment after trial)';
COMMENT ON TABLE subscription_history IS 'Audit log of all subscription changes and manual payments';
