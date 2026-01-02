-- =============================================================================
-- GYMGO - Row Level Security Policies
-- Multi-Tenant Data Isolation
-- =============================================================================

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get the organization_id for the current user
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT organization_id
    FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has specific role in their organization
CREATE OR REPLACE FUNCTION has_role(required_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role >= required_role
    FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is owner or admin
CREATE OR REPLACE FUNCTION is_admin_or_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role IN ('owner', 'admin')
    FROM profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- ORGANIZATIONS POLICIES
-- =============================================================================

-- Users can view their own organization
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  USING (id = get_user_organization_id());

-- Owners can update their organization
CREATE POLICY "Owners can update own organization"
  ON organizations FOR UPDATE
  USING (id = get_user_organization_id() AND is_admin_or_owner());

-- Service role can do anything (for onboarding)
CREATE POLICY "Service role full access to organizations"
  ON organizations FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =============================================================================
-- PROFILES POLICIES
-- =============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Users can view profiles in their organization
CREATE POLICY "Users can view org profiles"
  ON profiles FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Admins can update profiles in their organization
CREATE POLICY "Admins can update org profiles"
  ON profiles FOR UPDATE
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

-- System can insert profiles (on user signup)
CREATE POLICY "System can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- MEMBERSHIP PLANS POLICIES
-- =============================================================================

-- Users can view plans in their organization
CREATE POLICY "Users can view org plans"
  ON membership_plans FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Admins can manage plans
CREATE POLICY "Admins can insert plans"
  ON membership_plans FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id() AND is_admin_or_owner());

CREATE POLICY "Admins can update plans"
  ON membership_plans FOR UPDATE
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

CREATE POLICY "Admins can delete plans"
  ON membership_plans FOR DELETE
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

-- =============================================================================
-- MEMBERS POLICIES
-- =============================================================================

-- Staff can view members in their organization
CREATE POLICY "Staff can view org members"
  ON members FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Members can view their own record
CREATE POLICY "Members can view own record"
  ON members FOR SELECT
  USING (profile_id = auth.uid());

-- Admins can manage members
CREATE POLICY "Admins can insert members"
  ON members FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id() AND is_admin_or_owner());

CREATE POLICY "Admins can update members"
  ON members FOR UPDATE
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

-- Members can update their own non-sensitive data
CREATE POLICY "Members can update own basic info"
  ON members FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "Admins can delete members"
  ON members FOR DELETE
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

-- =============================================================================
-- CLASSES POLICIES
-- =============================================================================

-- Users can view classes in their organization
CREATE POLICY "Users can view org classes"
  ON classes FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Admins and instructors can manage classes
CREATE POLICY "Staff can insert classes"
  ON classes FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND (is_admin_or_owner() OR instructor_id = auth.uid())
  );

CREATE POLICY "Staff can update classes"
  ON classes FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND (is_admin_or_owner() OR instructor_id = auth.uid())
  );

CREATE POLICY "Admins can delete classes"
  ON classes FOR DELETE
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

-- =============================================================================
-- BOOKINGS POLICIES
-- =============================================================================

-- Staff can view all bookings in their organization
CREATE POLICY "Staff can view org bookings"
  ON bookings FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Members can view their own bookings
CREATE POLICY "Members can view own bookings"
  ON bookings FOR SELECT
  USING (
    member_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
  );

-- Members can create their own bookings
CREATE POLICY "Members can create own bookings"
  ON bookings FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND member_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
  );

-- Staff can create bookings for any member
CREATE POLICY "Staff can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND is_admin_or_owner()
  );

-- Members can update their own bookings (cancel)
CREATE POLICY "Members can update own bookings"
  ON bookings FOR UPDATE
  USING (
    member_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
  );

-- Staff can update any booking
CREATE POLICY "Staff can update bookings"
  ON bookings FOR UPDATE
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

-- Staff can delete bookings
CREATE POLICY "Staff can delete bookings"
  ON bookings FOR DELETE
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

-- =============================================================================
-- CHECK-INS POLICIES
-- =============================================================================

-- Staff can view all check-ins
CREATE POLICY "Staff can view org check_ins"
  ON check_ins FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Members can view their own check-ins
CREATE POLICY "Members can view own check_ins"
  ON check_ins FOR SELECT
  USING (
    member_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
  );

-- Staff can create check-ins
CREATE POLICY "Staff can create check_ins"
  ON check_ins FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

-- Members can create their own check-ins (self check-in)
CREATE POLICY "Members can self check_in"
  ON check_ins FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND member_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
  );

-- =============================================================================
-- PAYMENTS POLICIES
-- =============================================================================

-- Admins can view all payments
CREATE POLICY "Admins can view org payments"
  ON payments FOR SELECT
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

-- Members can view their own payments
CREATE POLICY "Members can view own payments"
  ON payments FOR SELECT
  USING (
    member_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
  );

-- Admins can manage payments
CREATE POLICY "Admins can insert payments"
  ON payments FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id() AND is_admin_or_owner());

CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

-- =============================================================================
-- EXERCISES POLICIES
-- =============================================================================

-- Everyone can view global exercises
CREATE POLICY "Everyone can view global exercises"
  ON exercises FOR SELECT
  USING (is_global = true);

-- Users can view exercises in their organization
CREATE POLICY "Users can view org exercises"
  ON exercises FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Staff can manage exercises
CREATE POLICY "Staff can insert exercises"
  ON exercises FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND (is_admin_or_owner() OR has_role('instructor'))
  );

CREATE POLICY "Staff can update exercises"
  ON exercises FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND (is_admin_or_owner() OR has_role('instructor'))
  );

CREATE POLICY "Admins can delete exercises"
  ON exercises FOR DELETE
  USING (organization_id = get_user_organization_id() AND is_admin_or_owner());

-- =============================================================================
-- WORKOUTS POLICIES
-- =============================================================================

-- Staff can view all workouts
CREATE POLICY "Staff can view org workouts"
  ON workouts FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Members can view workouts assigned to them
CREATE POLICY "Members can view own workouts"
  ON workouts FOR SELECT
  USING (
    assigned_to_member_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
  );

-- Members can view template workouts
CREATE POLICY "Members can view template workouts"
  ON workouts FOR SELECT
  USING (
    organization_id = get_user_organization_id()
    AND is_template = true
  );

-- Staff can manage workouts
CREATE POLICY "Staff can insert workouts"
  ON workouts FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND (is_admin_or_owner() OR has_role('instructor'))
  );

CREATE POLICY "Staff can update workouts"
  ON workouts FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND (is_admin_or_owner() OR has_role('instructor'))
  );

-- Members can update their own workout results
CREATE POLICY "Members can update own workout results"
  ON workouts FOR UPDATE
  USING (
    assigned_to_member_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
  );

CREATE POLICY "Staff can delete workouts"
  ON workouts FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND (is_admin_or_owner() OR has_role('instructor'))
  );
