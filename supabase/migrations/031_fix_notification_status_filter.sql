-- Migration: Fix notification status filter
-- Allow notifications for both 'active' and 'expired' members
-- Only exclude 'cancelled' and 'frozen' members

-- =============================================================================
-- UPDATE get_members_needing_expiration_notifications
-- =============================================================================
CREATE OR REPLACE FUNCTION get_members_needing_expiration_notifications(
  p_organization_id UUID DEFAULT NULL
) RETURNS TABLE (
  organization_id UUID,
  member_id UUID,
  member_name VARCHAR(100),
  member_email VARCHAR(255),
  member_phone VARCHAR(20),
  membership_end_date DATE,
  days_until_expiry INTEGER,
  notification_type membership_notification_type,
  idempotency_key VARCHAR(255)
) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
BEGIN
  RETURN QUERY
  WITH member_status AS (
    SELECT
      m.organization_id,
      m.id AS member_id,
      m.full_name AS member_name,
      m.email AS member_email,
      m.phone AS member_phone,
      m.membership_end_date,
      (m.membership_end_date - v_today) AS days_until
    FROM members m
    WHERE m.membership_status NOT IN ('cancelled', 'frozen')  -- Changed: exclude only cancelled/frozen
      AND m.membership_end_date IS NOT NULL
      AND (p_organization_id IS NULL OR m.organization_id = p_organization_id)
      -- Include: 3 days, 1 day, today, or already expired (up to 1 day ago for late notifications)
      AND m.membership_end_date BETWEEN (v_today - INTERVAL '1 day')::DATE AND (v_today + INTERVAL '3 days')::DATE
  ),
  notifications_needed AS (
    SELECT
      ms.*,
      CASE
        WHEN ms.days_until = 3 THEN 'expires_in_3_days'::membership_notification_type
        WHEN ms.days_until = 1 THEN 'expires_in_1_day'::membership_notification_type
        WHEN ms.days_until = 0 THEN 'expires_today'::membership_notification_type
        WHEN ms.days_until < 0 THEN 'expired'::membership_notification_type
      END AS notif_type
    FROM member_status ms
    WHERE ms.days_until IN (3, 1, 0) OR ms.days_until < 0
  )
  SELECT
    nn.organization_id,
    nn.member_id,
    nn.member_name,
    nn.member_email,
    nn.member_phone,
    nn.membership_end_date,
    nn.days_until AS days_until_expiry,
    nn.notif_type AS notification_type,
    generate_membership_notification_key(
      nn.organization_id,
      nn.member_id,
      nn.notif_type,
      v_today
    ) AS idempotency_key
  FROM notifications_needed nn
  -- Filter out already sent notifications
  WHERE NOT is_notification_sent(
    generate_membership_notification_key(
      nn.organization_id,
      nn.member_id,
      nn.notif_type,
      v_today
    )
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- UPDATE expire_memberships_with_notifications
-- Don't change status to expired again if already expired
-- =============================================================================
CREATE OR REPLACE FUNCTION expire_memberships_with_notifications()
RETURNS TABLE (
  expired_count INTEGER,
  notifications_queued INTEGER
) AS $$
DECLARE
  v_expired_count INTEGER := 0;
  v_notif_count INTEGER := 0;
  v_member RECORD;
BEGIN
  -- 1. Mark expired memberships (only active ones)
  WITH expired AS (
    UPDATE members
    SET
      membership_status = 'expired',
      updated_at = NOW()
    WHERE membership_status = 'active'
      AND membership_end_date < CURRENT_DATE
    RETURNING id, organization_id, full_name, email, phone, membership_end_date
  )
  SELECT COUNT(*) INTO v_expired_count FROM expired;

  -- 2. Queue notifications for members needing them (active OR expired)
  FOR v_member IN
    SELECT * FROM get_members_needing_expiration_notifications()
  LOOP
    -- Queue email if member has email
    IF v_member.member_email IS NOT NULL THEN
      PERFORM queue_membership_notification(
        v_member.organization_id,
        v_member.member_id,
        v_member.notification_type,
        'email',
        v_member.member_email,
        NULL,
        v_member.membership_end_date
      );
      v_notif_count := v_notif_count + 1;
    END IF;

    -- Queue WhatsApp if member has phone
    IF v_member.member_phone IS NOT NULL THEN
      PERFORM queue_membership_notification(
        v_member.organization_id,
        v_member.member_id,
        v_member.notification_type,
        'whatsapp',
        NULL,
        v_member.member_phone,
        v_member.membership_end_date
      );
      v_notif_count := v_notif_count + 1;
    END IF;
  END LOOP;

  expired_count := v_expired_count;
  notifications_queued := v_notif_count;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_members_needing_expiration_notifications IS
  'Returns members who need expiration notifications. Excludes cancelled/frozen members.';
