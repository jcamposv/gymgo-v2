-- =============================================================================
-- MIGRATION: Multi-Location Support (Phase 1 - Foundation)
-- =============================================================================
-- This migration creates the locations table and auto-creates a primary
-- location for each existing organization using their current address.
--
-- NO UI CHANGES - system behaves exactly as before
-- =============================================================================

-- =============================================================================
-- 1. CREATE LOCATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identity
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,

  -- Address (migrated from organizations table)
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'MX',

  -- Contact
  phone TEXT,
  email TEXT,

  -- Status
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. INDEXES
-- =============================================================================

-- Ensure only ONE primary location per organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_primary
  ON locations(organization_id)
  WHERE is_primary = true;

-- Unique slug per organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_org_slug
  ON locations(organization_id, slug);

-- Fast organization lookup
CREATE INDEX IF NOT EXISTS idx_locations_org_id
  ON locations(organization_id);

-- Active locations lookup
CREATE INDEX IF NOT EXISTS idx_locations_active
  ON locations(organization_id, is_active);

-- =============================================================================
-- 3. RLS POLICIES
-- =============================================================================

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- SELECT: Any authenticated user in the organization can view locations
CREATE POLICY "locations_select_policy" ON locations
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- INSERT: Only owners and admins can create locations
CREATE POLICY "locations_insert_policy" ON locations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- UPDATE: Only owners and admins can update locations
CREATE POLICY "locations_update_policy" ON locations
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- DELETE: Only owners can delete locations (admin cannot)
CREATE POLICY "locations_delete_policy" ON locations
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
    -- Cannot delete primary location
    AND is_primary = false
  );

-- =============================================================================
-- 4. UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER locations_updated_at_trigger
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_locations_updated_at();

-- =============================================================================
-- 5. AUTO-CREATE PRIMARY LOCATION FOR EXISTING ORGANIZATIONS
-- =============================================================================
-- This backfills the locations table with a "Sucursal Principal" for each
-- existing organization, copying their address data.

INSERT INTO locations (
  organization_id,
  name,
  slug,
  description,
  address_line1,
  address_line2,
  city,
  state,
  postal_code,
  country,
  phone,
  email,
  is_primary,
  is_active
)
SELECT
  o.id AS organization_id,
  'Sucursal Principal' AS name,
  'principal' AS slug,
  'Ubicación principal del gimnasio' AS description,
  o.address_line1,
  o.address_line2,
  o.city,
  o.state,
  o.postal_code,
  COALESCE(o.country, 'MX') AS country,
  o.phone,
  o.email,
  true AS is_primary,
  true AS is_active
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM locations l WHERE l.organization_id = o.id
);

-- =============================================================================
-- 6. HELPER FUNCTION: Get primary location for organization
-- =============================================================================

CREATE OR REPLACE FUNCTION get_primary_location(org_id UUID)
RETURNS UUID AS $$
DECLARE
  loc_id UUID;
BEGIN
  SELECT id INTO loc_id
  FROM locations
  WHERE organization_id = org_id AND is_primary = true
  LIMIT 1;

  RETURN loc_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 7. HELPER FUNCTION: Count locations for organization
-- =============================================================================

CREATE OR REPLACE FUNCTION count_organization_locations(org_id UUID)
RETURNS INTEGER AS $$
DECLARE
  loc_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO loc_count
  FROM locations
  WHERE organization_id = org_id AND is_active = true;

  RETURN loc_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 8. TRIGGER: Auto-create primary location for new organizations
-- =============================================================================

CREATE OR REPLACE FUNCTION auto_create_primary_location()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO locations (
    organization_id,
    name,
    slug,
    description,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    country,
    phone,
    email,
    is_primary,
    is_active
  ) VALUES (
    NEW.id,
    'Sucursal Principal',
    'principal',
    'Ubicación principal del gimnasio',
    NEW.address_line1,
    NEW.address_line2,
    NEW.city,
    NEW.state,
    NEW.postal_code,
    COALESCE(NEW.country, 'MX'),
    NEW.phone,
    NEW.email,
    true,
    true
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER organization_auto_create_location
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_primary_location();

-- =============================================================================
-- DONE
-- =============================================================================
-- At this point:
-- - All existing organizations have a primary location
-- - New organizations will auto-get a primary location
-- - System behaves exactly as before (no UI changes)
-- - locations table is ready for Phase 2
