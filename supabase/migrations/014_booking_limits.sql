-- =============================================================================
-- GYMGO - Booking Limits Feature
-- Migration: Add max_classes_per_day to organizations
-- =============================================================================

-- Add max_classes_per_day column to organizations table
-- NULL = unlimited, 1-10 = specific daily limit per member
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS max_classes_per_day INTEGER DEFAULT NULL;

-- Add constraint to ensure valid values
ALTER TABLE organizations
ADD CONSTRAINT max_classes_per_day_range
CHECK (max_classes_per_day IS NULL OR (max_classes_per_day >= 1 AND max_classes_per_day <= 10));

-- Add comment for documentation
COMMENT ON COLUMN organizations.max_classes_per_day IS
  'Maximum number of classes a member can book per day. NULL means unlimited. Valid range: 1-10.';

-- =============================================================================
-- FUNCTION: Count member bookings for a specific day (timezone-aware)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_member_daily_booking_count(
  p_member_id UUID,
  p_organization_id UUID,
  p_target_date DATE,
  p_timezone TEXT DEFAULT 'America/Mexico_City',
  p_exclude_booking_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM bookings b
  JOIN classes c ON b.class_id = c.id
  WHERE b.member_id = p_member_id
    AND b.organization_id = p_organization_id
    AND b.status IN ('confirmed', 'waitlist', 'attended', 'no_show')
    AND (c.start_time AT TIME ZONE p_timezone)::DATE = p_target_date
    AND (p_exclude_booking_id IS NULL OR b.id != p_exclude_booking_id);

  RETURN v_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- FUNCTION: Check if member can book a class (with daily limit validation)
-- Returns: TRUE if can book, FALSE if limit reached
-- =============================================================================

CREATE OR REPLACE FUNCTION can_member_book_class(
  p_member_id UUID,
  p_organization_id UUID,
  p_class_start_time TIMESTAMPTZ,
  p_exclude_booking_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_max_per_day INTEGER;
  v_timezone TEXT;
  v_target_date DATE;
  v_current_count INTEGER;
BEGIN
  -- Get organization settings
  SELECT max_classes_per_day, COALESCE(timezone, 'America/Mexico_City')
  INTO v_max_per_day, v_timezone
  FROM organizations
  WHERE id = p_organization_id;

  -- No limit set = always can book
  IF v_max_per_day IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Calculate target date in gym's timezone
  v_target_date := (p_class_start_time AT TIME ZONE v_timezone)::DATE;

  -- Count existing bookings for that day
  v_current_count := get_member_daily_booking_count(
    p_member_id,
    p_organization_id,
    v_target_date,
    v_timezone,
    p_exclude_booking_id
  );

  RETURN v_current_count < v_max_per_day;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- INDEX: Optimize daily booking count queries
-- =============================================================================

-- Composite index for efficient daily booking queries
CREATE INDEX IF NOT EXISTS idx_bookings_member_status_for_daily_count
ON bookings (member_id, organization_id, status)
WHERE status IN ('confirmed', 'waitlist', 'attended', 'no_show');
