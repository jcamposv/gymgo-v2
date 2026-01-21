-- =============================================================================
-- UPGRADE REQUESTS TABLE
-- Stores plan upgrade requests from gym owners/admins
-- =============================================================================

-- Create upgrade request status enum
CREATE TYPE upgrade_request_status AS ENUM ('pending', 'approved', 'rejected');

-- Create upgrade_requests table
CREATE TABLE IF NOT EXISTS upgrade_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_plan TEXT NOT NULL,
  current_plan TEXT,
  seats INTEGER,
  message TEXT,
  contact_email TEXT NOT NULL,
  contact_name TEXT,
  status upgrade_request_status DEFAULT 'pending' NOT NULL,
  admin_notes TEXT,
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX idx_upgrade_requests_organization_id ON upgrade_requests(organization_id);
CREATE INDEX idx_upgrade_requests_status ON upgrade_requests(status);
CREATE INDEX idx_upgrade_requests_created_at ON upgrade_requests(created_at DESC);

-- Enable RLS
ALTER TABLE upgrade_requests ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Policy: Users can view their own organization's upgrade requests
CREATE POLICY "Users can view own org upgrade requests"
  ON upgrade_requests
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can create upgrade requests for their own organization
CREATE POLICY "Users can create upgrade requests for own org"
  ON upgrade_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Policy: No updates allowed from regular users (admin manual only)
-- Note: Updates will be done via service role or direct DB access

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE TRIGGER update_upgrade_requests_updated_at
  BEFORE UPDATE ON upgrade_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FUNCTION: Get latest pending upgrade request for an organization
-- =============================================================================

CREATE OR REPLACE FUNCTION get_latest_upgrade_request(p_organization_id UUID)
RETURNS TABLE (
  id UUID,
  requested_plan TEXT,
  current_plan TEXT,
  status upgrade_request_status,
  contact_email TEXT,
  contact_name TEXT,
  message TEXT,
  seats INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ur.id,
    ur.requested_plan,
    ur.current_plan,
    ur.status,
    ur.contact_email,
    ur.contact_name,
    ur.message,
    ur.seats,
    ur.created_at
  FROM upgrade_requests ur
  WHERE ur.organization_id = p_organization_id
  ORDER BY ur.created_at DESC
  LIMIT 1;
END;
$$;
