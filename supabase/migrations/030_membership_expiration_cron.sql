-- Migration: Membership Expiration Cron Job
-- Configures daily cron job to expire memberships and send notifications
--
-- NOTE: pg_cron extension must be enabled in Supabase Dashboard:
-- Database > Extensions > pg_cron
--
-- The cron job calls the Edge Function/API endpoint that processes expirations.
-- For Supabase, we use pg_net extension to make HTTP calls.

-- =============================================================================
-- ENABLE REQUIRED EXTENSIONS
-- =============================================================================
-- pg_cron is enabled by default in Supabase but requires manual activation
-- pg_net allows HTTP requests from PostgreSQL

CREATE EXTENSION IF NOT EXISTS pg_net;

-- =============================================================================
-- CRON JOB FUNCTION
-- This function is called by pg_cron and makes an HTTP request to our API
-- =============================================================================
CREATE OR REPLACE FUNCTION call_membership_expiration_cron()
RETURNS void AS $$
DECLARE
  v_api_url TEXT;
  v_cron_secret TEXT;
BEGIN
  -- Get environment variables (set these as Supabase secrets)
  -- In Supabase: Settings > Vault > Secrets
  v_api_url := current_setting('app.api_url', true);
  v_cron_secret := current_setting('app.cron_secret', true);

  -- Make HTTP POST request to our cron endpoint
  PERFORM net.http_post(
    url := v_api_url || '/api/cron/membership-expiration',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_cron_secret
    ),
    body := '{}'::jsonb
  );

  RAISE NOTICE 'Membership expiration cron job triggered at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ALTERNATIVE: DIRECT DATABASE FUNCTION (No HTTP call needed)
-- This is more efficient as it runs directly in the database
-- =============================================================================
CREATE OR REPLACE FUNCTION run_membership_expiration_batch()
RETURNS jsonb AS $$
DECLARE
  v_result RECORD;
  v_notifications_processed INTEGER := 0;
BEGIN
  -- Call the expire function which marks expired memberships and queues notifications
  SELECT * INTO v_result FROM expire_memberships_with_notifications();

  RAISE NOTICE 'Membership expiration batch: expired=%, queued=%',
    v_result.expired_count, v_result.notifications_queued;

  RETURN jsonb_build_object(
    'expired_count', v_result.expired_count,
    'notifications_queued', v_result.notifications_queued,
    'executed_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- CRON JOB SCHEDULING
-- Schedule: Every day at 6:00 AM (UTC)
-- Adjust timezone as needed for your region
-- =============================================================================
-- Note: This requires pg_cron to be enabled.
-- In Supabase Dashboard: Database > Extensions > pg_cron

-- Option 1: Direct database execution (recommended - no external HTTP call)
-- SELECT cron.schedule(
--   'membership-expiration-daily',
--   '0 6 * * *',  -- 6 AM UTC daily
--   $$ SELECT run_membership_expiration_batch(); $$
-- );

-- Option 2: HTTP call to Edge Function (if you need to run notification sending in Node.js)
-- SELECT cron.schedule(
--   'membership-expiration-daily',
--   '0 6 * * *',  -- 6 AM UTC daily
--   $$ SELECT call_membership_expiration_cron(); $$
-- );

-- =============================================================================
-- MANUAL CRON SETUP INSTRUCTIONS
-- =============================================================================
-- Since pg_cron requires manual extension activation, run this manually in Supabase SQL Editor:
--
-- 1. Enable pg_cron extension (if not already):
--    CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- 2. Schedule the job (choose one option):
--
--    OPTION A - Direct DB (processes in DB, needs separate job to send emails):
--    SELECT cron.schedule(
--      'membership-expiration-daily',
--      '0 12 * * *',  -- 12:00 PM UTC = 6:00 AM Mexico City
--      $$ SELECT run_membership_expiration_batch(); $$
--    );
--
--    OPTION B - HTTP call (sends emails/WhatsApp via Node.js):
--    First set the secrets in Supabase Vault:
--    - app.api_url = 'https://your-app.vercel.app'
--    - app.cron_secret = 'your-cron-secret'
--
--    Then schedule:
--    SELECT cron.schedule(
--      'membership-expiration-daily',
--      '0 12 * * *',
--      $$ SELECT call_membership_expiration_cron(); $$
--    );
--
-- 3. View scheduled jobs:
--    SELECT * FROM cron.job;
--
-- 4. View job run history:
--    SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
--
-- 5. Unschedule if needed:
--    SELECT cron.unschedule('membership-expiration-daily');

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================
GRANT EXECUTE ON FUNCTION call_membership_expiration_cron() TO service_role;
GRANT EXECUTE ON FUNCTION run_membership_expiration_batch() TO service_role;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON FUNCTION call_membership_expiration_cron() IS
  'Triggers membership expiration processing via HTTP call to API endpoint';
COMMENT ON FUNCTION run_membership_expiration_batch() IS
  'Directly runs membership expiration batch in database (marks expired, queues notifications)';
