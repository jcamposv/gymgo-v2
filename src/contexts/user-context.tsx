'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/client'
import {
  type AppRole,
  type AppPermission,
  type UserContext,
  type MemberProfile,
  hasPermission as checkPermission,
  hasRole as checkRole,
  hasAnyPermission as checkAnyPermission,
  hasAllPermissions as checkAllPermissions,
  isAdmin as checkIsAdmin,
  isStaff as checkIsStaff,
  mapLegacyRole,
  APP_ROLES,
} from '@/lib/rbac'

// =============================================================================
// TYPES
// =============================================================================

interface UserContextValue {
  // Auth user
  user: User | null
  // Profile with role
  profile: UserContext | null
  // Member profile (if user is also a gym member)
  memberProfile: MemberProfile | null
  // Loading states
  loading: boolean
  profileLoading: boolean
  // Helper functions
  hasPermission: (permission: AppPermission) => boolean
  hasAnyPermission: (permissions: AppPermission[]) => boolean
  hasAllPermissions: (permissions: AppPermission[]) => boolean
  hasRole: (role: AppRole) => boolean
  isAdmin: () => boolean
  isStaff: () => boolean
  // Has a member profile (can view own workouts/progress)
  hasMemberProfile: boolean
  // Refresh profile data
  refreshProfile: () => Promise<void>
}

// =============================================================================
// CONTEXT
// =============================================================================

const UserContextInstance = createContext<UserContextValue | undefined>(undefined)

// =============================================================================
// PROVIDER
// =============================================================================

interface UserProviderProps {
  children: ReactNode
  initialUser?: User | null
}

export function UserProvider({ children, initialUser = null }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [profile, setProfile] = useState<UserContext | null>(null)
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null)
  const [loading, setLoading] = useState(!initialUser)
  const [profileLoading, setProfileLoading] = useState(true)

  const supabase = createClient()

  // Fetch user profile and member profile
  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true)

    try {
      // Fetch profile with role
      const { data: profileResult, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, phone, role, organization_id')
        .eq('id', userId)
        .single()

      if (profileError || !profileResult) {
        console.error('Error fetching profile:', profileError)
        setProfile(null)
        setMemberProfile(null)
        return
      }

      // Cast to expected type
      const profileData = profileResult as {
        id: string
        email: string
        full_name: string | null
        avatar_url: string | null
        phone: string | null
        role: string
        organization_id: string | null
      }

      // Map legacy role to AppRole
      const appRole = mapLegacyRole(profileData.role)

      // Fetch member profile if exists (linked via profile_id in members table)
      let memberData: MemberProfile | null = null

      if (profileData.organization_id) {
        const { data: memberResult } = await supabase
          .from('members')
          .select('id, full_name, email, status, current_plan_id, membership_status')
          .eq('organization_id', profileData.organization_id)
          .eq('email', profileData.email)
          .maybeSingle() // Use maybeSingle to handle case when user is not a member

        if (memberResult) {
          memberData = memberResult as MemberProfile
        }
      }

      const userContext: UserContext = {
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        avatar_url: profileData.avatar_url,
        role: appRole,
        organization_id: profileData.organization_id,
        member_profile: memberData,
      }

      setProfile(userContext)
      setMemberProfile(memberData)
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      setProfile(null)
      setMemberProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }, [supabase])

  // Refresh profile (can be called after profile updates)
  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  // Listen for auth changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      setLoading(false)

      if (currentUser) {
        fetchProfile(currentUser.id)
      } else {
        setProfile(null)
        setMemberProfile(null)
        setProfileLoading(false)
      }
    })

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        setLoading(false)

        if (currentUser) {
          fetchProfile(currentUser.id)
        } else {
          setProfile(null)
          setMemberProfile(null)
          setProfileLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth, fetchProfile])

  // Permission helpers
  const hasPermission = useCallback(
    (permission: AppPermission) => checkPermission(profile, permission),
    [profile]
  )

  const hasAnyPermission = useCallback(
    (permissions: AppPermission[]) => checkAnyPermission(profile, permissions),
    [profile]
  )

  const hasAllPermissions = useCallback(
    (permissions: AppPermission[]) => checkAllPermissions(profile, permissions),
    [profile]
  )

  const hasRole = useCallback(
    (role: AppRole) => checkRole(profile, role),
    [profile]
  )

  const isAdmin = useCallback(
    () => checkIsAdmin(profile),
    [profile]
  )

  const isStaff = useCallback(
    () => checkIsStaff(profile),
    [profile]
  )

  const value: UserContextValue = {
    user,
    profile,
    memberProfile,
    loading,
    profileLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
    isStaff,
    hasMemberProfile: !!memberProfile,
    refreshProfile,
  }

  return (
    <UserContextInstance.Provider value={value}>
      {children}
    </UserContextInstance.Provider>
  )
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to access user context
 */
export function useUser() {
  const context = useContext(UserContextInstance)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

/**
 * Hook specifically for permission checks
 * Returns helpers and current role
 */
export function usePermissions() {
  const {
    profile,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
    isStaff,
    hasMemberProfile,
    profileLoading,
  } = useUser()

  return {
    role: profile?.role ?? APP_ROLES.CLIENT,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
    isStaff,
    hasMemberProfile,
    loading: profileLoading,
  }
}

/**
 * Hook to check a single permission
 * Useful for conditional rendering
 */
export function useHasPermission(permission: AppPermission): boolean {
  const { hasPermission, loading } = usePermissions()

  // While loading, deny access
  if (loading) return false

  return hasPermission(permission)
}

/**
 * Hook to check if user can manage a resource
 */
export function useCanManage(
  resource: 'members' | 'plans' | 'classes' | 'exercises' | 'settings' | 'staff'
): boolean {
  const { hasPermission, loading } = usePermissions()

  if (loading) return false

  const permissionMap: Record<string, AppPermission> = {
    members: 'manage_members',
    plans: 'manage_plans',
    classes: 'manage_classes',
    exercises: 'manage_exercises',
    settings: 'manage_gym_settings',
    staff: 'manage_staff',
  }

  const permission = permissionMap[resource]
  return permission ? hasPermission(permission) : false
}
