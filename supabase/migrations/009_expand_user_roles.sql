-- =============================================================================
-- Migration: Expand user_role enum with new roles
-- =============================================================================
-- This migration adds new role values to support the expanded RBAC system:
-- - super_admin: Platform administrator (multi-organization)
-- - assistant: Gym staff with limited admin access
-- - nutritionist: Nutrition specialist
--
-- Existing roles are preserved:
-- - owner -> maps to admin in app layer
-- - admin -> full gym access
-- - instructor -> maps to trainer in app layer
-- - member -> maps to client in app layer
--
-- Note: PostgreSQL doesn't allow removing enum values, only adding.
-- The app layer (mapLegacyRole) handles mapping old values to new AppRole types.
-- =============================================================================

-- Add new enum values to user_role
-- PostgreSQL 9.1+ supports adding values to enums

-- Add super_admin role (platform-level admin)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Add assistant role (staff with limited admin)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'assistant';

-- Add nutritionist role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'nutritionist';

-- Add trainer role (alias for instructor, more modern naming)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'trainer';

-- Add client role (alias for member, clearer naming)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'client';

-- =============================================================================
-- ROLE HIERARCHY DOCUMENTATION
-- =============================================================================
-- After this migration, the user_role enum will have:
--
-- Legacy values (maintained for backwards compatibility):
--   - 'owner'      -> maps to ADMIN in app
--   - 'admin'      -> maps to ADMIN in app
--   - 'instructor' -> maps to TRAINER in app
--   - 'member'     -> maps to CLIENT in app
--
-- New values (preferred for new users):
--   - 'super_admin'  -> SUPER_ADMIN in app (platform admin)
--   - 'assistant'    -> ASSISTANT in app (staff, no finances)
--   - 'trainer'      -> TRAINER in app (workout management)
--   - 'nutritionist' -> NUTRITIONIST in app (nutrition/metrics)
--   - 'client'       -> CLIENT in app (gym member)
--
-- The mapping is handled in src/lib/rbac/helpers.ts -> mapLegacyRole()
-- =============================================================================

-- Update the has_role function to work with new roles
CREATE OR REPLACE FUNCTION has_role(required_role user_role)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a new helper function to check if user is staff (any admin/staff role)
CREATE OR REPLACE FUNCTION is_staff_member()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('owner', 'admin', 'super_admin', 'assistant', 'instructor', 'trainer', 'nutritionist')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper to check if user is admin-level
CREATE OR REPLACE FUNCTION is_admin_level()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('owner', 'admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
