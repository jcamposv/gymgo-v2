-- Migration: Membership Expiration Notifications
-- Adds idempotent notification tracking for membership expiration alerts

-- =============================================================================
-- NOTIFICATION TYPE ENUM
-- =============================================================================
DO $$ BEGIN
  CREATE TYPE membership_notification_type AS ENUM (
    'expires_in_3_days',
    'expires_in_1_day',
    'expires_today',
    'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM (
    'email',
    'whatsapp',
    'push'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM (
    'queued',
    'sent',
    'failed',
    'skipped'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- MEMBERSHIP NOTIFICATIONS TABLE
-- Tracks all membership expiration notifications for idempotency
-- =============================================================================
CREATE TABLE IF NOT EXISTS membership_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Notification details
  notification_type membership_notification_type NOT NULL,
  channel notification_channel NOT NULL,
  status notification_status NOT NULL DEFAULT 'queued',

  -- For idempotency - unique key per member/type/period
  idempotency_key VARCHAR(255) NOT NULL,

  -- Notification metadata
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(50),
  membership_end_date DATE,

  -- Timestamps
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,

  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- External references
  external_message_id VARCHAR(255), -- Twilio SID or Resend ID

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure idempotency: one notification per member/type/period
  CONSTRAINT unique_notification_per_period UNIQUE (idempotency_key)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_membership_notifications_org
  ON membership_notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_membership_notifications_member
  ON membership_notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_membership_notifications_status
  ON membership_notifications(status) WHERE status IN ('queued', 'failed');
CREATE INDEX IF NOT EXISTS idx_membership_notifications_scheduled
  ON membership_notifications(scheduled_at) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_membership_notifications_type_date
  ON membership_notifications(notification_type, created_at DESC);

-- RLS Policies
ALTER TABLE membership_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can view their org's notifications
CREATE POLICY "membership_notifications_admin_read" ON membership_notifications
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- System/service role can insert/update (for cron jobs)
CREATE POLICY "membership_notifications_service_all" ON membership_notifications
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Generate idempotency key for membership notifications
-- Format: org_id:member_id:type:YYYY-MM-DD
CREATE OR REPLACE FUNCTION generate_membership_notification_key(
  p_organization_id UUID,
  p_member_id UUID,
  p_notification_type membership_notification_type,
  p_reference_date DATE DEFAULT CURRENT_DATE
) RETURNS VARCHAR(255) AS $$
BEGIN
  RETURN p_organization_id::TEXT || ':' ||
         p_member_id::TEXT || ':' ||
         p_notification_type::TEXT || ':' ||
         p_reference_date::TEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Check if notification already sent for this period
CREATE OR REPLACE FUNCTION is_notification_sent(
  p_idempotency_key VARCHAR(255)
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM membership_notifications
    WHERE idempotency_key = p_idempotency_key
    AND status IN ('sent', 'queued')
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- GET MEMBERS NEEDING EXPIRATION NOTIFICATIONS
-- Returns members who need notifications based on their end_date
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
    WHERE m.membership_status = 'active'
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
-- QUEUE NOTIFICATION
-- Inserts a notification record (idempotent - skips if exists)
-- =============================================================================
CREATE OR REPLACE FUNCTION queue_membership_notification(
  p_organization_id UUID,
  p_member_id UUID,
  p_notification_type membership_notification_type,
  p_channel notification_channel,
  p_recipient_email VARCHAR(255) DEFAULT NULL,
  p_recipient_phone VARCHAR(50) DEFAULT NULL,
  p_membership_end_date DATE DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_idempotency_key VARCHAR(255);
  v_notification_id UUID;
BEGIN
  v_idempotency_key := generate_membership_notification_key(
    p_organization_id,
    p_member_id,
    p_notification_type
  ) || ':' || p_channel::TEXT;

  -- Try to insert, skip if duplicate
  INSERT INTO membership_notifications (
    organization_id,
    member_id,
    notification_type,
    channel,
    status,
    idempotency_key,
    recipient_email,
    recipient_phone,
    membership_end_date
  )
  VALUES (
    p_organization_id,
    p_member_id,
    p_notification_type,
    p_channel,
    'queued',
    v_idempotency_key,
    p_recipient_email,
    p_recipient_phone,
    p_membership_end_date
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MARK NOTIFICATION AS SENT/FAILED
-- =============================================================================
CREATE OR REPLACE FUNCTION mark_notification_sent(
  p_notification_id UUID,
  p_external_message_id VARCHAR(255) DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE membership_notifications
  SET
    status = 'sent',
    sent_at = NOW(),
    external_message_id = p_external_message_id,
    updated_at = NOW()
  WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mark_notification_failed(
  p_notification_id UUID,
  p_error_message TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE membership_notifications
  SET
    status = 'failed',
    error_message = p_error_message,
    retry_count = retry_count + 1,
    updated_at = NOW()
  WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ENHANCED EXPIRE MEMBERSHIPS WITH NOTIFICATION QUEUEING
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
  -- 1. Mark expired memberships
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

  -- 2. Queue notifications for members needing them
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

-- =============================================================================
-- GET QUEUED NOTIFICATIONS FOR PROCESSING
-- =============================================================================
CREATE OR REPLACE FUNCTION get_queued_notifications(
  p_channel notification_channel DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
) RETURNS TABLE (
  id UUID,
  organization_id UUID,
  member_id UUID,
  notification_type membership_notification_type,
  channel notification_channel,
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(50),
  membership_end_date DATE,
  retry_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mn.id,
    mn.organization_id,
    mn.member_id,
    mn.notification_type,
    mn.channel,
    mn.recipient_email,
    mn.recipient_phone,
    mn.membership_end_date,
    mn.retry_count
  FROM membership_notifications mn
  WHERE mn.status = 'queued'
    AND (p_channel IS NULL OR mn.channel = p_channel)
    AND mn.retry_count < 3 -- Max 3 retries
  ORDER BY mn.scheduled_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE membership_notifications IS
  'Tracks membership expiration notifications for idempotency and auditing';
COMMENT ON FUNCTION get_members_needing_expiration_notifications IS
  'Returns members who need expiration notifications (3 days, 1 day, today, expired)';
COMMENT ON FUNCTION expire_memberships_with_notifications IS
  'Batch function: marks expired memberships and queues notifications. Run daily via cron.';
COMMENT ON FUNCTION get_queued_notifications IS
  'Gets queued notifications for processing by the notification service';
