-- =============================================================================
-- ADD PREFERRED VIEW FIELD TO PROFILES TABLE
-- =============================================================================
-- This field allows staff members who are also gym members to choose their
-- default view when logging in:
-- - 'dashboard': Staff view (/dashboard) - default for staff
-- - 'member': Client view (/member) - for viewing their own progress
--
-- This only applies to users with both view_admin_dashboard AND
-- view_client_dashboard permissions (staff who are also members).
-- =============================================================================

-- Create enum type for preferred view
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'preferred_view_type') THEN
    CREATE TYPE preferred_view_type AS ENUM ('dashboard', 'member');
  END IF;
END$$;

-- Add preferred_view column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_view preferred_view_type DEFAULT 'dashboard';

-- Add comment explaining the field
COMMENT ON COLUMN profiles.preferred_view IS
  'Preferred default view for users with both dashboard and member access. dashboard = staff view, member = client view';
