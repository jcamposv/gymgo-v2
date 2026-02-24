-- =============================================================================
-- FIX: Add location_id to payments table
-- =============================================================================
-- Migration 025 reported "already exists" but the column was not actually there.
-- This migration ensures the column exists and is properly backfilled.
-- =============================================================================

-- Add location_id column to payments
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_payments_location ON payments(location_id);
CREATE INDEX IF NOT EXISTS idx_payments_location_date ON payments(organization_id, location_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_location_status ON payments(organization_id, location_id, status);

-- Backfill existing payments with member's location
UPDATE payments p
SET location_id = (
  SELECT m.location_id FROM members m
  WHERE m.id = p.member_id
)
WHERE p.location_id IS NULL
AND p.member_id IS NOT NULL;

-- Create/replace trigger to auto-set location_id from member on insert
CREATE OR REPLACE FUNCTION set_payment_location_from_member()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.location_id IS NULL AND NEW.member_id IS NOT NULL THEN
    SELECT location_id INTO NEW.location_id
    FROM members
    WHERE id = NEW.member_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_auto_set_location ON payments;

CREATE TRIGGER payment_auto_set_location
BEFORE INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION set_payment_location_from_member();
