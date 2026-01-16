-- =============================================================================
-- GYMGO - WhatsApp Module
-- Payment Reminders via Twilio
-- =============================================================================

-- =============================================================================
-- ENUMS
-- =============================================================================

-- WhatsApp template types
CREATE TYPE whatsapp_template_type AS ENUM (
  'payment_reminder',
  'payment_overdue',
  'payment_confirmation',
  'membership_expiring',
  'membership_expired',
  'welcome',
  'custom'
);

-- WhatsApp template approval status
CREATE TYPE whatsapp_template_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'disabled'
);

-- WhatsApp setup status
CREATE TYPE whatsapp_setup_status AS ENUM (
  'pending',
  'phone_pending',
  'active',
  'suspended'
);

-- Notification channels (unified for push, whatsapp, email, sms)
CREATE TYPE notification_channel AS ENUM (
  'push',
  'whatsapp',
  'email',
  'sms'
);

-- Notification delivery status
CREATE TYPE notification_delivery_status AS ENUM (
  'pending',
  'queued',
  'sent',
  'delivered',
  'read',
  'failed',
  'undelivered'
);

-- =============================================================================
-- TABLE: gym_whatsapp_settings
-- Twilio subaccount configuration per gym
-- =============================================================================

CREATE TABLE gym_whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,

  -- Twilio Subaccount Credentials
  twilio_account_sid TEXT NOT NULL,
  twilio_auth_token TEXT NOT NULL,
  twilio_subaccount_name TEXT,

  -- WhatsApp Sender Configuration
  whatsapp_phone_number TEXT,
  whatsapp_sender_sid TEXT,

  -- Reminder Configuration
  is_enabled BOOLEAN DEFAULT false,
  reminder_days_before INTEGER[] DEFAULT '{3, 1, 0}',
  reminder_hour INTEGER DEFAULT 9 CHECK (reminder_hour >= 0 AND reminder_hour <= 23),

  -- Feature Flags
  auto_opt_in_new_members BOOLEAN DEFAULT false,
  send_payment_confirmation BOOLEAN DEFAULT true,
  send_membership_expiry_warning BOOLEAN DEFAULT true,

  -- Status
  setup_status whatsapp_setup_status DEFAULT 'pending',
  last_sync_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_whatsapp_settings_org ON gym_whatsapp_settings(organization_id);
CREATE INDEX idx_whatsapp_settings_status ON gym_whatsapp_settings(setup_status)
  WHERE is_enabled = true;

-- Trigger for updated_at
CREATE TRIGGER update_gym_whatsapp_settings_updated_at
  BEFORE UPDATE ON gym_whatsapp_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- TABLE: whatsapp_templates
-- Message template definitions with Twilio Content API integration
-- =============================================================================

CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template Identity
  name VARCHAR(100) NOT NULL,
  template_type whatsapp_template_type NOT NULL,

  -- Twilio Content API Integration
  twilio_content_sid TEXT,
  twilio_template_name TEXT,

  -- Template Content
  language VARCHAR(5) DEFAULT 'es',
  header_text TEXT,
  body_text TEXT NOT NULL,
  footer_text TEXT,

  -- Variables definition (JSON array)
  variables JSONB DEFAULT '[]'::jsonb,

  -- Call to Action buttons (JSON array)
  cta_buttons JSONB DEFAULT '[]'::jsonb,

  -- Status
  status whatsapp_template_status DEFAULT 'draft',
  rejection_reason TEXT,

  -- Usage tracking
  is_default BOOLEAN DEFAULT false,
  last_used_at TIMESTAMPTZ,
  send_count INTEGER DEFAULT 0,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_whatsapp_templates_org ON whatsapp_templates(organization_id);
CREATE INDEX idx_whatsapp_templates_type ON whatsapp_templates(organization_id, template_type);
CREATE INDEX idx_whatsapp_templates_status ON whatsapp_templates(status);
CREATE INDEX idx_whatsapp_templates_default ON whatsapp_templates(organization_id, template_type, is_default)
  WHERE is_default = true;

-- Trigger for updated_at
CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- TABLE: member_notification_preferences
-- WhatsApp opt-in/out and notification preferences per member
-- =============================================================================

CREATE TABLE member_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL UNIQUE REFERENCES members(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- WhatsApp Configuration
  whatsapp_phone TEXT,
  whatsapp_phone_verified BOOLEAN DEFAULT false,
  whatsapp_opted_in BOOLEAN DEFAULT false,
  whatsapp_opted_in_at TIMESTAMPTZ,
  whatsapp_opted_out_at TIMESTAMPTZ,

  -- Granular WhatsApp Preferences
  receive_payment_reminders BOOLEAN DEFAULT true,
  receive_payment_confirmations BOOLEAN DEFAULT true,
  receive_membership_alerts BOOLEAN DEFAULT true,
  receive_class_reminders BOOLEAN DEFAULT true,
  receive_promotional BOOLEAN DEFAULT false,

  -- Push Notification Preferences
  push_enabled BOOLEAN DEFAULT true,
  push_payment_reminders BOOLEAN DEFAULT true,
  push_class_reminders BOOLEAN DEFAULT true,

  -- Quiet Hours (optional)
  quiet_hours_start TIME,
  quiet_hours_end TIME,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notification_prefs_member ON member_notification_preferences(member_id);
CREATE INDEX idx_notification_prefs_org ON member_notification_preferences(organization_id);
CREATE INDEX idx_notification_prefs_whatsapp_opted_in ON member_notification_preferences(organization_id, whatsapp_opted_in)
  WHERE whatsapp_opted_in = true;
CREATE INDEX idx_notification_prefs_phone ON member_notification_preferences(whatsapp_phone)
  WHERE whatsapp_phone IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_member_notification_preferences_updated_at
  BEFORE UPDATE ON member_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- TABLE: notification_delivery_log
-- Unified log for Push, WhatsApp, Email, and SMS notifications
-- =============================================================================

CREATE TABLE notification_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,

  -- Notification Details
  channel notification_channel NOT NULL,
  notification_type TEXT NOT NULL,

  -- Content
  template_id UUID REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
  subject TEXT,
  body TEXT NOT NULL,
  variables_used JSONB,

  -- Recipient
  recipient_phone TEXT,
  recipient_email TEXT,
  recipient_device_token TEXT,

  -- Provider Response
  provider TEXT,
  provider_message_id TEXT,
  provider_status TEXT,
  provider_response JSONB,

  -- Status Tracking
  status notification_delivery_status DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  error_code TEXT,

  -- Retry Logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,

  -- Idempotency (org:member:type:date format)
  idempotency_key TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_delivery_log_org ON notification_delivery_log(organization_id);
CREATE INDEX idx_delivery_log_member ON notification_delivery_log(member_id);
CREATE INDEX idx_delivery_log_channel ON notification_delivery_log(organization_id, channel);
CREATE INDEX idx_delivery_log_status_pending ON notification_delivery_log(status)
  WHERE status IN ('pending', 'queued');
CREATE INDEX idx_delivery_log_provider_id ON notification_delivery_log(provider_message_id)
  WHERE provider_message_id IS NOT NULL;
CREATE INDEX idx_delivery_log_idempotency ON notification_delivery_log(idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_delivery_log_created ON notification_delivery_log(organization_id, created_at DESC);
CREATE INDEX idx_delivery_log_retry ON notification_delivery_log(next_retry_at)
  WHERE status = 'failed' AND retry_count < max_retries;

-- Trigger for updated_at
CREATE TRIGGER update_notification_delivery_log_updated_at
  BEFORE UPDATE ON notification_delivery_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE gym_whatsapp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery_log ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- gym_whatsapp_settings Policies
-- -----------------------------------------------------------------------------

CREATE POLICY "Admin can view org whatsapp settings"
  ON gym_whatsapp_settings FOR SELECT
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

CREATE POLICY "Admin can insert whatsapp settings"
  ON gym_whatsapp_settings FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id() AND is_admin_or_owner());

CREATE POLICY "Admin can update whatsapp settings"
  ON gym_whatsapp_settings FOR UPDATE
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

CREATE POLICY "Admin can delete whatsapp settings"
  ON gym_whatsapp_settings FOR DELETE
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

CREATE POLICY "Service role full access to whatsapp settings"
  ON gym_whatsapp_settings FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- -----------------------------------------------------------------------------
-- whatsapp_templates Policies
-- -----------------------------------------------------------------------------

CREATE POLICY "Staff can view org templates"
  ON whatsapp_templates FOR SELECT
  USING (organization_id = get_user_organization_id() AND is_staff());

CREATE POLICY "Admin can insert templates"
  ON whatsapp_templates FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id() AND is_admin_or_owner());

CREATE POLICY "Admin can update templates"
  ON whatsapp_templates FOR UPDATE
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

CREATE POLICY "Admin can delete templates"
  ON whatsapp_templates FOR DELETE
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

CREATE POLICY "Service role full access to templates"
  ON whatsapp_templates FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- -----------------------------------------------------------------------------
-- member_notification_preferences Policies
-- -----------------------------------------------------------------------------

CREATE POLICY "Staff can view org notification prefs"
  ON member_notification_preferences FOR SELECT
  USING (organization_id = get_user_organization_id() AND is_staff());

CREATE POLICY "Admin can insert notification prefs"
  ON member_notification_preferences FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id() AND is_admin_or_owner());

CREATE POLICY "Admin can update notification prefs"
  ON member_notification_preferences FOR UPDATE
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

CREATE POLICY "Admin can delete notification prefs"
  ON member_notification_preferences FOR DELETE
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

-- Members can view and update their own preferences
CREATE POLICY "Members can view own notification prefs"
  ON member_notification_preferences FOR SELECT
  USING (member_id IN (SELECT id FROM members WHERE profile_id = auth.uid()));

CREATE POLICY "Members can update own notification prefs"
  ON member_notification_preferences FOR UPDATE
  USING (member_id IN (SELECT id FROM members WHERE profile_id = auth.uid()));

CREATE POLICY "Service role full access to notification prefs"
  ON member_notification_preferences FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- -----------------------------------------------------------------------------
-- notification_delivery_log Policies
-- -----------------------------------------------------------------------------

CREATE POLICY "Admin can view org delivery log"
  ON notification_delivery_log FOR SELECT
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

CREATE POLICY "Service role full access to delivery log"
  ON notification_delivery_log FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE gym_whatsapp_settings IS 'Twilio WhatsApp configuration per organization';
COMMENT ON TABLE whatsapp_templates IS 'WhatsApp message templates with Twilio Content API integration';
COMMENT ON TABLE member_notification_preferences IS 'Member notification preferences and opt-in status';
COMMENT ON TABLE notification_delivery_log IS 'Unified delivery log for all notification channels';

COMMENT ON COLUMN gym_whatsapp_settings.twilio_auth_token IS 'Encrypted Twilio auth token for the subaccount';
COMMENT ON COLUMN gym_whatsapp_settings.reminder_days_before IS 'Array of days before due date to send reminders (e.g., {3, 1, 0})';
COMMENT ON COLUMN whatsapp_templates.variables IS 'JSON array of variable definitions: [{key, type, example, description}]';
COMMENT ON COLUMN whatsapp_templates.cta_buttons IS 'JSON array of CTA buttons: [{type, text, url/phone}]';
COMMENT ON COLUMN notification_delivery_log.idempotency_key IS 'Format: org_id:member_id:notification_type:YYYY-MM-DD';

-- =============================================================================
-- PG_CRON SETUP (Run after enabling pg_cron extension in Supabase Dashboard)
-- =============================================================================

-- Note: Before running this, enable pg_cron in Supabase Dashboard:
-- 1. Go to Database > Extensions
-- 2. Enable pg_cron

-- Create cron job to run payment reminders every hour
-- SELECT cron.schedule(
--   'payment-reminders',
--   '0 * * * *',  -- Every hour at minute 0
--   $$
--   SELECT net.http_post(
--     url := current_setting('app.settings.edge_function_url') || '/payment-reminders',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret')
--     ),
--     body := '{}'
--   );
--   $$
-- );

-- Alternative: Using pg_net extension directly
-- Note: Requires pg_net extension enabled
-- SELECT cron.schedule(
--   'payment-reminders-hourly',
--   '0 * * * *',
--   $$
--   SELECT
--     net.http_post(
--       url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/payment-reminders',
--       headers:='{"Authorization": "Bearer YOUR_CRON_SECRET", "Content-Type": "application/json"}'::jsonb,
--       body:='{}'::jsonb
--     ) as request_id;
--   $$
-- );
