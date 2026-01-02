-- =============================================================================
-- FIX: Allow authenticated users to create organizations (onboarding)
-- =============================================================================

-- Allow any authenticated user to create an organization (for onboarding)
-- The application logic ensures users only create one organization
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Fix SELECT policy - need to allow slug checks during onboarding
-- Organization basic info is not sensitive; member data is protected by other RLS
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;

-- Authenticated users can view all organizations (for slug availability check)
-- This is safe because sensitive business data is in other tables with proper RLS
CREATE POLICY "Authenticated users can view organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (true);
