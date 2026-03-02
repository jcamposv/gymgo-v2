-- =============================================================================
-- Stripe Billing Tables
-- =============================================================================

-- 1. stripe_customers: Link organizations to Stripe customer IDs
CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uq_stripe_customers_org UNIQUE (organization_id),
  CONSTRAINT uq_stripe_customers_stripe UNIQUE (stripe_customer_id)
);

-- 2. stripe_subscriptions: Track active Stripe subscriptions
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  plan_tier subscription_plan NOT NULL,
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uq_stripe_subscriptions_stripe UNIQUE (stripe_subscription_id)
);

-- 3. stripe_prices: Cache of Stripe price objects for reference
CREATE TABLE IF NOT EXISTS stripe_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_price_id TEXT NOT NULL,
  stripe_product_id TEXT NOT NULL,
  plan_tier subscription_plan NOT NULL,
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uq_stripe_prices_stripe UNIQUE (stripe_price_id)
);

-- 4. billing_history: Invoice and payment records
CREATE TABLE IF NOT EXISTS billing_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'failed', 'pending', 'refunded')),
  description TEXT,
  invoice_url TEXT,
  invoice_pdf TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_stripe_customers_org ON stripe_customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_org ON stripe_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status ON stripe_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_billing_history_org ON billing_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_created ON billing_history(created_at DESC);

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

-- SELECT: users can view their own organization's billing data
CREATE POLICY "Users can view own org stripe customer"
  ON stripe_customers FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view own org stripe subscription"
  ON stripe_subscriptions FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view stripe prices"
  ON stripe_prices FOR SELECT
  USING (true);

CREATE POLICY "Users can view own org billing history"
  ON billing_history FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- INSERT/UPDATE/DELETE: only service role (handled by admin client bypassing RLS)
-- No explicit policies needed — service role key bypasses RLS

-- =============================================================================
-- Triggers: auto-update updated_at
-- =============================================================================

CREATE OR REPLACE TRIGGER update_stripe_customers_updated_at
  BEFORE UPDATE ON stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_stripe_subscriptions_updated_at
  BEFORE UPDATE ON stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
