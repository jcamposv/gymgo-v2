-- =============================================================================
-- ADD INVITATION TRACKING FIELDS TO MEMBERS TABLE
-- =============================================================================
-- These fields help track:
-- - user_id: The auth.users ID associated with this member (when they accept invitation)
-- - invitation_sent_at: When the invitation was sent
-- - invitation_accepted_at: When the invitation was accepted (optional, for tracking)
--
-- The profile_id field already exists and links to the profiles table.
-- The user_id field is redundant but useful for direct auth lookups.
-- =============================================================================

-- Add invitation tracking columns to members table
ALTER TABLE members
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMPTZ;

-- Add index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);

-- Add index for faster lookups by invitation status
CREATE INDEX IF NOT EXISTS idx_members_invitation_sent ON members(invitation_sent_at) WHERE invitation_sent_at IS NOT NULL;

-- Add address fields if they don't exist (for completeness)
ALTER TABLE members
ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255),
ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS country VARCHAR(2),
ADD COLUMN IF NOT EXISTS emergency_contact_relation VARCHAR(50);

-- Comment explaining the invitation flow
COMMENT ON COLUMN members.user_id IS 'The auth.users ID for this member. Set when invitation is sent/accepted.';
COMMENT ON COLUMN members.profile_id IS 'The profiles.id for this member. Should match user_id.';
COMMENT ON COLUMN members.invitation_sent_at IS 'When the invitation email was sent to the member.';
COMMENT ON COLUMN members.invitation_accepted_at IS 'When the member accepted the invitation and set their password.';
