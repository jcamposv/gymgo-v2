-- =============================================================================
-- FIX: User Signup Trigger
-- =============================================================================

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- FIX: has_role function (enum comparison doesn't work with >=)
-- Need to drop dependent policies first, then recreate
-- =============================================================================

-- Drop policies that depend on has_role
DROP POLICY IF EXISTS "Staff can insert exercises" ON exercises;
DROP POLICY IF EXISTS "Staff can update exercises" ON exercises;
DROP POLICY IF EXISTS "Staff can insert workouts" ON workouts;
DROP POLICY IF EXISTS "Staff can update workouts" ON workouts;
DROP POLICY IF EXISTS "Staff can delete workouts" ON workouts;

-- Now we can drop and recreate the function
DROP FUNCTION IF EXISTS has_role(user_role);

CREATE OR REPLACE FUNCTION has_role(required_role user_role)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_val user_role;
  role_order INT;
  required_order INT;
BEGIN
  SELECT role INTO user_role_val FROM profiles WHERE id = auth.uid();

  IF user_role_val IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Define role hierarchy: owner > admin > instructor > member
  role_order := CASE user_role_val
    WHEN 'owner' THEN 4
    WHEN 'admin' THEN 3
    WHEN 'instructor' THEN 2
    WHEN 'member' THEN 1
    ELSE 0
  END;

  required_order := CASE required_role
    WHEN 'owner' THEN 4
    WHEN 'admin' THEN 3
    WHEN 'instructor' THEN 2
    WHEN 'member' THEN 1
    ELSE 0
  END;

  RETURN role_order >= required_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the policies
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

CREATE POLICY "Staff can delete workouts"
  ON workouts FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND (is_admin_or_owner() OR has_role('instructor'))
  );

-- =============================================================================
-- Ensure profiles table allows insert from trigger
-- =============================================================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
