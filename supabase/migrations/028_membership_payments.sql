-- =============================================================================
-- GYMGO - Membership Payments System
-- Manual membership payment tracking with expiration enforcement
-- =============================================================================

-- =============================================================================
-- 1. ENUM: Payment Period Type
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE payment_period_type AS ENUM (
    'monthly',      -- 1 month
    'bimonthly',    -- 2 months
    'quarterly',    -- 3 months
    'semiannual',   -- 6 months
    'annual',       -- 12 months
    'custom'        -- Custom number of months
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 2. TABLE: Membership Payments
-- Tracks each payment that extends a member's membership
-- =============================================================================

CREATE TABLE IF NOT EXISTS membership_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES membership_plans(id) ON DELETE SET NULL,

  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'MXN',
  payment_method VARCHAR(30) NOT NULL DEFAULT 'cash',
  reference_number VARCHAR(100),

  -- Period covered by this payment
  period_type payment_period_type NOT NULL DEFAULT 'monthly',
  period_months INTEGER NOT NULL DEFAULT 1 CHECK (period_months >= 1 AND period_months <= 36),
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,

  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure end_date is after start_date
  CONSTRAINT valid_period_dates CHECK (period_end_date > period_start_date)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_membership_payments_org ON membership_payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_membership_payments_member ON membership_payments(member_id);
CREATE INDEX IF NOT EXISTS idx_membership_payments_period ON membership_payments(period_start_date, period_end_date);
CREATE INDEX IF NOT EXISTS idx_membership_payments_created ON membership_payments(created_at DESC);

-- =============================================================================
-- 3. RLS POLICIES FOR membership_payments
-- =============================================================================

ALTER TABLE membership_payments ENABLE ROW LEVEL SECURITY;

-- Staff can view payments from their organization
CREATE POLICY "Staff can view org membership payments" ON membership_payments
  FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Staff can create payments
CREATE POLICY "Staff can create membership payments" ON membership_payments
  FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

-- Staff can update payments (admin only in practice via app logic)
CREATE POLICY "Staff can update membership payments" ON membership_payments
  FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- Staff can delete payments (admin only in practice via app logic)
CREATE POLICY "Staff can delete membership payments" ON membership_payments
  FOR DELETE
  USING (organization_id = get_user_organization_id());

-- =============================================================================
-- 4. FUNCTION: Calculate period end date
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_membership_end_date(
  p_start_date DATE,
  p_period_months INTEGER
) RETURNS DATE AS $$
BEGIN
  RETURN p_start_date + (p_period_months || ' months')::INTERVAL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- 5. FUNCTION: Validate member can book (membership check)
-- Returns error code if member cannot book, NULL if allowed
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_member_for_booking(
  p_member_id UUID,
  p_organization_id UUID,
  p_class_start_time TIMESTAMPTZ DEFAULT NULL
) RETURNS TABLE (
  can_book BOOLEAN,
  error_code VARCHAR(50),
  error_message TEXT
) AS $$
DECLARE
  v_member RECORD;
  v_org_timezone VARCHAR(50);
  v_check_date DATE;
BEGIN
  -- Get organization timezone
  SELECT timezone INTO v_org_timezone
  FROM organizations
  WHERE id = p_organization_id;

  v_org_timezone := COALESCE(v_org_timezone, 'America/Mexico_City');

  -- Calculate the date to check (either class date or today)
  IF p_class_start_time IS NOT NULL THEN
    v_check_date := (p_class_start_time AT TIME ZONE v_org_timezone)::DATE;
  ELSE
    v_check_date := (NOW() AT TIME ZONE v_org_timezone)::DATE;
  END IF;

  -- Get member data
  SELECT
    m.id,
    m.status,
    m.membership_status,
    m.membership_end_date,
    m.current_plan_id
  INTO v_member
  FROM members m
  WHERE m.id = p_member_id
    AND m.organization_id = p_organization_id;

  -- Member not found
  IF v_member IS NULL THEN
    RETURN QUERY SELECT FALSE, 'MEMBER_NOT_FOUND'::VARCHAR(50), 'Miembro no encontrado'::TEXT;
    RETURN;
  END IF;

  -- Member is inactive
  IF v_member.status != 'active' THEN
    RETURN QUERY SELECT FALSE, 'MEMBER_INACTIVE'::VARCHAR(50), 'El miembro no está activo'::TEXT;
    RETURN;
  END IF;

  -- No membership assigned
  IF v_member.membership_end_date IS NULL THEN
    RETURN QUERY SELECT FALSE, 'NO_MEMBERSHIP'::VARCHAR(50), 'No tienes una membresía activa. Contacta a recepción.'::TEXT;
    RETURN;
  END IF;

  -- Membership expired
  IF v_member.membership_end_date < v_check_date THEN
    RETURN QUERY SELECT
      FALSE,
      'MEMBERSHIP_EXPIRED'::VARCHAR(50),
      ('Tu membresía venció el ' || TO_CHAR(v_member.membership_end_date, 'DD/MM/YYYY') || '. Renueva para reservar clases.')::TEXT;
    RETURN;
  END IF;

  -- Membership status check
  IF v_member.membership_status NOT IN ('active') THEN
    RETURN QUERY SELECT
      FALSE,
      'MEMBERSHIP_NOT_ACTIVE'::VARCHAR(50),
      ('Tu membresía está ' || COALESCE(v_member.membership_status, 'sin estado') || '. Contacta a recepción.')::TEXT;
    RETURN;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT TRUE, NULL::VARCHAR(50), NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 6. FUNCTION: Update member membership after payment
-- =============================================================================

CREATE OR REPLACE FUNCTION update_member_membership_from_payment(
  p_member_id UUID,
  p_plan_id UUID DEFAULT NULL,
  p_period_start DATE DEFAULT NULL,
  p_period_end DATE DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE members
  SET
    current_plan_id = COALESCE(p_plan_id, current_plan_id),
    membership_start_date = CASE
      WHEN membership_start_date IS NULL THEN p_period_start
      WHEN p_period_start < membership_start_date THEN p_period_start
      ELSE membership_start_date
    END,
    membership_end_date = CASE
      WHEN membership_end_date IS NULL THEN p_period_end
      WHEN p_period_end > membership_end_date THEN p_period_end
      ELSE membership_end_date
    END,
    membership_status = 'active',
    updated_at = NOW()
  WHERE id = p_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 7. FUNCTION: Batch expire memberships (for scheduled job)
-- =============================================================================

CREATE OR REPLACE FUNCTION expire_memberships() RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE members
    SET
      membership_status = 'expired',
      updated_at = NOW()
    WHERE membership_status = 'active'
      AND membership_end_date < CURRENT_DATE
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM expired;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 8. FUNCTION: Get membership status with details
-- =============================================================================

CREATE OR REPLACE FUNCTION get_membership_status(
  p_member_id UUID
) RETURNS TABLE (
  status VARCHAR(20),
  days_remaining INTEGER,
  end_date DATE,
  plan_name VARCHAR(100),
  is_expiring_soon BOOLEAN,
  last_payment_date DATE,
  last_payment_amount DECIMAL(10,2)
) AS $$
DECLARE
  v_org_timezone VARCHAR(50);
  v_today DATE;
BEGIN
  -- Get member's org timezone
  SELECT o.timezone INTO v_org_timezone
  FROM members m
  JOIN organizations o ON o.id = m.organization_id
  WHERE m.id = p_member_id;

  v_org_timezone := COALESCE(v_org_timezone, 'America/Mexico_City');
  v_today := (NOW() AT TIME ZONE v_org_timezone)::DATE;

  RETURN QUERY
  SELECT
    CASE
      WHEN m.membership_end_date IS NULL THEN 'no_membership'
      WHEN m.membership_end_date < v_today THEN 'expired'
      WHEN m.membership_end_date <= v_today + INTERVAL '7 days' THEN 'expiring_soon'
      ELSE 'active'
    END::VARCHAR(20) AS status,
    CASE
      WHEN m.membership_end_date IS NULL THEN NULL
      ELSE GREATEST(0, m.membership_end_date - v_today)::INTEGER
    END AS days_remaining,
    m.membership_end_date AS end_date,
    mp.name::VARCHAR(100) AS plan_name,
    (m.membership_end_date IS NOT NULL AND m.membership_end_date <= v_today + INTERVAL '7 days' AND m.membership_end_date >= v_today)::BOOLEAN AS is_expiring_soon,
    lp.payment_date::DATE AS last_payment_date,
    lp.amount AS last_payment_amount
  FROM members m
  LEFT JOIN membership_plans mp ON mp.id = m.current_plan_id
  LEFT JOIN LATERAL (
    SELECT period_start_date AS payment_date, amount
    FROM membership_payments
    WHERE member_id = m.id
    ORDER BY created_at DESC
    LIMIT 1
  ) lp ON TRUE
  WHERE m.id = p_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 9. TRIGGER: Auto-update updated_at on membership_payments
-- =============================================================================

CREATE OR REPLACE FUNCTION update_membership_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_membership_payments_updated_at ON membership_payments;
CREATE TRIGGER trigger_membership_payments_updated_at
  BEFORE UPDATE ON membership_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_membership_payments_updated_at();

-- =============================================================================
-- 10. GRANT EXECUTE permissions
-- =============================================================================

GRANT EXECUTE ON FUNCTION validate_member_for_booking(UUID, UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_membership_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_membership_end_date(DATE, INTEGER) TO authenticated;

-- =============================================================================
-- 11. Add helpful comments
-- =============================================================================

COMMENT ON TABLE membership_payments IS 'Tracks manual membership payments with period coverage';
COMMENT ON FUNCTION validate_member_for_booking IS 'Validates if a member can book a class based on membership status';
COMMENT ON FUNCTION get_membership_status IS 'Returns detailed membership status for a member';
COMMENT ON FUNCTION expire_memberships IS 'Batch function to mark expired memberships - run daily via cron';
