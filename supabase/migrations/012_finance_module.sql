-- =============================================================================
-- FINANCE MODULE - Payments Extension, Expenses & Income Tables
-- =============================================================================

-- =============================================================================
-- HELPER FUNCTIONS (must be created first for RLS policies)
-- =============================================================================

-- Create is_staff function if it doesn't exist
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role IN ('owner', 'admin', 'super_admin', 'assistant', 'trainer', 'nutritionist')
    FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- EXTEND PAYMENTS TABLE
-- =============================================================================

-- Add missing columns to payments table
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Rename membership_plan_id to plan_id for consistency (if not already renamed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'membership_plan_id'
  ) THEN
    ALTER TABLE payments RENAME COLUMN membership_plan_id TO plan_id;
  END IF;
END $$;

-- Add comment for payment_method values
COMMENT ON COLUMN payments.payment_method IS 'Payment method: cash, card, transfer, other';

-- Create index for payment_date queries
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(organization_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_created_by ON payments(created_by);

-- =============================================================================
-- EXPENSE CATEGORIES ENUM
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_category') THEN
    CREATE TYPE expense_category AS ENUM (
      'rent',
      'utilities',
      'salaries',
      'equipment',
      'maintenance',
      'marketing',
      'supplies',
      'insurance',
      'taxes',
      'other'
    );
  END IF;
END $$;

-- =============================================================================
-- EXPENSES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Expense Info
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MXN',
  category expense_category DEFAULT 'other',

  -- Details
  expense_date TIMESTAMPTZ DEFAULT NOW(),
  vendor VARCHAR(100),
  receipt_url TEXT,
  notes TEXT,
  is_recurring BOOLEAN DEFAULT false,

  -- Audit
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_org ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(organization_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(organization_id, category);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- INCOME CATEGORIES ENUM
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'income_category') THEN
    CREATE TYPE income_category AS ENUM (
      'product_sale',
      'service',
      'rental',
      'event',
      'donation',
      'other'
    );
  END IF;
END $$;

-- =============================================================================
-- INCOME TABLE (for non-membership income)
-- =============================================================================

CREATE TABLE IF NOT EXISTS income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Income Info
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MXN',
  category income_category DEFAULT 'other',

  -- Details
  income_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,

  -- Audit
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for income
CREATE INDEX IF NOT EXISTS idx_income_org ON income(organization_id);
CREATE INDEX IF NOT EXISTS idx_income_date ON income(organization_id, income_date);
CREATE INDEX IF NOT EXISTS idx_income_category ON income(organization_id, category);
CREATE INDEX IF NOT EXISTS idx_income_created_by ON income(created_by);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_income_updated_at ON income;
CREATE TRIGGER update_income_updated_at
  BEFORE UPDATE ON income
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- RLS POLICIES FOR PAYMENTS (update existing)
-- =============================================================================

-- Enable RLS if not already enabled
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Staff can view org payments" ON payments;
DROP POLICY IF EXISTS "Staff can create payments" ON payments;
DROP POLICY IF EXISTS "Admin can update payments" ON payments;
DROP POLICY IF EXISTS "Admin can delete payments" ON payments;

-- Staff can view payments from their organization
CREATE POLICY "Staff can view org payments"
  ON payments FOR SELECT
  USING (
    organization_id = get_user_organization_id()
    AND is_staff()
  );

-- Staff can create payments for their organization
CREATE POLICY "Staff can create payments"
  ON payments FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND is_staff()
  );

-- Only admin can update payments
CREATE POLICY "Admin can update payments"
  ON payments FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND is_admin_or_owner()
  );

-- Only admin can delete payments
CREATE POLICY "Admin can delete payments"
  ON payments FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND is_admin_or_owner()
  );

-- =============================================================================
-- RLS POLICIES FOR EXPENSES
-- =============================================================================

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Staff can view expenses from their organization
CREATE POLICY "Staff can view org expenses"
  ON expenses FOR SELECT
  USING (
    organization_id = get_user_organization_id()
    AND is_staff()
  );

-- Staff can create expenses for their organization
CREATE POLICY "Staff can create expenses"
  ON expenses FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND is_staff()
  );

-- Only admin can update expenses
CREATE POLICY "Admin can update expenses"
  ON expenses FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND is_admin_or_owner()
  );

-- Only admin can delete expenses
CREATE POLICY "Admin can delete expenses"
  ON expenses FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND is_admin_or_owner()
  );

-- =============================================================================
-- RLS POLICIES FOR INCOME
-- =============================================================================

ALTER TABLE income ENABLE ROW LEVEL SECURITY;

-- Staff can view income from their organization
CREATE POLICY "Staff can view org income"
  ON income FOR SELECT
  USING (
    organization_id = get_user_organization_id()
    AND is_staff()
  );

-- Staff can create income for their organization
CREATE POLICY "Staff can create income"
  ON income FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND is_staff()
  );

-- Only admin can update income
CREATE POLICY "Admin can update income"
  ON income FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND is_admin_or_owner()
  );

-- Only admin can delete income
CREATE POLICY "Admin can delete income"
  ON income FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND is_admin_or_owner()
  );

-- =============================================================================
-- GRANTS
-- =============================================================================

-- Grant access to authenticated users (RLS will handle row-level security)
GRANT SELECT, INSERT, UPDATE, DELETE ON payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON income TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE expenses IS 'Gym operational expenses (rent, utilities, salaries, etc.)';
COMMENT ON TABLE income IS 'Non-membership income (product sales, services, rentals, etc.)';
COMMENT ON COLUMN payments.payment_method IS 'Method of payment: cash, card, transfer, other';
COMMENT ON COLUMN payments.payment_date IS 'Date when payment was made (may differ from created_at)';
COMMENT ON COLUMN payments.created_by IS 'Staff member who registered the payment';
COMMENT ON COLUMN expenses.is_recurring IS 'Flag for recurring monthly expenses';
