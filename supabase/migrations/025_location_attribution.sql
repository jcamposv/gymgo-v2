-- =============================================================================
-- MIGRATION: Multi-Location Accounting Attribution
-- =============================================================================
-- Adds location_id to members, payments, expenses, and income tables
-- for per-branch accounting and reporting.
--
-- Business Rules:
-- - Members: REQUIRED location (backfilled to primary, then NOT NULL)
-- - Payments: Auto-derived from member's location (trigger)
-- - Expenses: OPTIONAL (NULL = org-wide expense)
-- - Income: OPTIONAL (NULL = org-wide income)
-- =============================================================================

-- =============================================================================
-- 1. ADD COLUMNS (all nullable initially for safe migration)
-- =============================================================================

-- Members: location where the member is registered
ALTER TABLE members
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Payments: location attribution (for reporting, derived from member)
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Expenses: optional location (NULL = shared/org-wide expense)
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Income: optional location (NULL = shared/org-wide income)
ALTER TABLE income
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- =============================================================================
-- 2. BACKFILL MEMBERS WITH PRIMARY LOCATION
-- =============================================================================
-- All existing members get assigned to their org's primary location

UPDATE members m
SET location_id = (
  SELECT l.id FROM locations l
  WHERE l.organization_id = m.organization_id
  AND l.is_primary = true
  LIMIT 1
)
WHERE m.location_id IS NULL;

-- =============================================================================
-- 3. BACKFILL PAYMENTS FROM MEMBER'S LOCATION
-- =============================================================================
-- Historical payments inherit location from their member

UPDATE payments p
SET location_id = (
  SELECT m.location_id FROM members m
  WHERE m.id = p.member_id
)
WHERE p.location_id IS NULL
AND p.member_id IS NOT NULL;

-- =============================================================================
-- 4. ADD NOT NULL CONSTRAINT TO MEMBERS
-- =============================================================================
-- After backfill, members MUST have a location

ALTER TABLE members
ALTER COLUMN location_id SET NOT NULL;

-- =============================================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Members by location (for member counts per branch)
CREATE INDEX IF NOT EXISTS idx_members_location
ON members(location_id);

CREATE INDEX IF NOT EXISTS idx_members_org_location
ON members(organization_id, location_id);

CREATE INDEX IF NOT EXISTS idx_members_location_status
ON members(organization_id, location_id, status);

-- Payments by location (critical for revenue reports)
CREATE INDEX IF NOT EXISTS idx_payments_location
ON payments(location_id);

CREATE INDEX IF NOT EXISTS idx_payments_location_date
ON payments(organization_id, location_id, payment_date);

CREATE INDEX IF NOT EXISTS idx_payments_location_status
ON payments(organization_id, location_id, status);

-- Expenses by location (for expense reports)
CREATE INDEX IF NOT EXISTS idx_expenses_location
ON expenses(location_id);

CREATE INDEX IF NOT EXISTS idx_expenses_org_location_date
ON expenses(organization_id, location_id, expense_date);

-- Income by location (for income reports)
CREATE INDEX IF NOT EXISTS idx_income_location
ON income(location_id);

CREATE INDEX IF NOT EXISTS idx_income_org_location_date
ON income(organization_id, location_id, income_date);

-- =============================================================================
-- 6. TRIGGER: Auto-set payment.location_id from member
-- =============================================================================
-- When a payment is created, automatically copy the member's location_id
-- This ensures historical accuracy even if member changes location later

CREATE OR REPLACE FUNCTION set_payment_location_from_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-populate if location_id is not explicitly provided
  IF NEW.location_id IS NULL AND NEW.member_id IS NOT NULL THEN
    SELECT location_id INTO NEW.location_id
    FROM members
    WHERE id = NEW.member_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS payment_auto_set_location ON payments;

-- Create trigger for INSERT only (not UPDATE - preserve historical location)
CREATE TRIGGER payment_auto_set_location
BEFORE INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION set_payment_location_from_member();

-- =============================================================================
-- 7. HELPER FUNCTIONS
-- =============================================================================

-- Get active member count for a location
CREATE OR REPLACE FUNCTION get_location_member_count(loc_id UUID)
RETURNS INTEGER AS $$
DECLARE
  member_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO member_count
  FROM members
  WHERE location_id = loc_id
  AND status = 'active';

  RETURN member_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get total revenue for a location in a date range
CREATE OR REPLACE FUNCTION get_location_revenue(
  loc_id UUID,
  start_date TIMESTAMPTZ DEFAULT NULL,
  end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS DECIMAL AS $$
DECLARE
  total_revenue DECIMAL;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_revenue
  FROM payments
  WHERE location_id = loc_id
  AND status = 'paid'
  AND (start_date IS NULL OR payment_date >= start_date)
  AND (end_date IS NULL OR payment_date <= end_date);

  RETURN total_revenue;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get total expenses for a location (including org-wide if include_shared=true)
CREATE OR REPLACE FUNCTION get_location_expenses(
  loc_id UUID,
  start_date TIMESTAMPTZ DEFAULT NULL,
  end_date TIMESTAMPTZ DEFAULT NULL,
  include_shared BOOLEAN DEFAULT false
)
RETURNS DECIMAL AS $$
DECLARE
  total_expenses DECIMAL;
  org_id UUID;
BEGIN
  -- Get organization_id from location
  SELECT organization_id INTO org_id
  FROM locations
  WHERE id = loc_id;

  IF include_shared THEN
    -- Include location-specific AND org-wide expenses
    SELECT COALESCE(SUM(amount), 0) INTO total_expenses
    FROM expenses
    WHERE organization_id = org_id
    AND (location_id = loc_id OR location_id IS NULL)
    AND (start_date IS NULL OR expense_date >= start_date)
    AND (end_date IS NULL OR expense_date <= end_date);
  ELSE
    -- Only location-specific expenses
    SELECT COALESCE(SUM(amount), 0) INTO total_expenses
    FROM expenses
    WHERE location_id = loc_id
    AND (start_date IS NULL OR expense_date >= start_date)
    AND (end_date IS NULL OR expense_date <= end_date);
  END IF;

  RETURN total_expenses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 8. UPDATE RLS POLICIES (if needed)
-- =============================================================================
-- Current RLS is org-level which is fine for now.
-- Location-level RLS can be added in future if needed.

-- No RLS changes required - existing org-level policies work correctly
-- because location_id references locations which are already org-scoped.

-- =============================================================================
-- DONE
-- =============================================================================
-- At this point:
-- - All members have a location_id (required)
-- - All historical payments have location_id from their member
-- - New payments auto-get location_id via trigger
-- - Expenses and income can optionally have location_id
-- - Indexes are in place for efficient queries
