'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendInvitationEmail } from '@/lib/email'
import type { AppRole } from '@/lib/rbac'
import { mapToDbRole } from '@/lib/rbac/helpers'
import { checkMemberLimit } from '@/lib/plan-limits'

// =============================================================================
// TYPES
// =============================================================================

export type InvitationResult = {
  success: boolean
  message: string
  error?: string
}

interface UserProfile {
  organization_id: string
  role: string
  userId: string
}

interface OrganizationData {
  id: string
  name: string
  logo_url: string | null
  address_line1: string | null
  city: string | null
  state: string | null
}

// =============================================================================
// HELPERS
// =============================================================================

async function getUserProfile(): Promise<{ profile: UserProfile | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { profile: null, error: 'No autenticado' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    return { profile: null, error: 'No se encontró la organización' }
  }

  const profileData = data as { organization_id: string | null; role: string }
  if (!profileData.organization_id) {
    return { profile: null, error: 'No se encontró la organización' }
  }

  return {
    profile: {
      organization_id: profileData.organization_id,
      role: profileData.role,
      userId: user.id,
    },
    error: null,
  }
}

async function getOrganization(orgId: string): Promise<OrganizationData | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, logo_url, address_line1, city, state')
    .eq('id', orgId)
    .single()

  if (error || !data) {
    return null
  }

  return data as OrganizationData
}

function formatGymAddress(org: OrganizationData): string | null {
  const parts = [org.address_line1, org.city, org.state].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : null
}

// =============================================================================
// SEND MEMBER INVITATION
// =============================================================================

/**
 * Sends an invitation email to a member
 * Creates a Supabase user if needed and sends a branded email
 * Optionally assigns a role to the user when created
 */
export async function sendMemberInvitation(
  memberId: string,
  assignRole?: AppRole
): Promise<InvitationResult> {
  try {
    // 1. Verify user is authenticated and get organization
    const { profile, error: profileError } = await getUserProfile()
    if (profileError || !profile) {
      return { success: false, message: profileError ?? 'No autenticado' }
    }

    // 2. Get member details
    const supabase = await createClient()
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('id, email, full_name, organization_id')
      .eq('id', memberId)
      .eq('organization_id', profile.organization_id)
      .single()

    if (memberError || !memberData) {
      return { success: false, message: 'Miembro no encontrado' }
    }

    const member = memberData as { id: string; email: string | null; full_name: string; organization_id: string }

    if (!member.email) {
      return { success: false, message: 'El miembro no tiene email registrado' }
    }

    // 3. Get organization details for branding
    const organization = await getOrganization(profile.organization_id)
    if (!organization) {
      return { success: false, message: 'Organización no encontrada' }
    }

    // 4. Generate invitation link using Supabase Admin
    const adminClient = createAdminClient()

    // Build redirect URL with gym branding params
    const brandingParams = new URLSearchParams({
      gym: organization.name,
      ...(organization.logo_url && { logo: organization.logo_url }),
    })
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invitation?${brandingParams.toString()}`

    // Generate an invite link (this creates the user if doesn't exist)
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'invite',
      email: member.email,
      options: {
        redirectTo: redirectUrl,
      },
    })

    if (linkError) {
      console.error('Error generating invite link:', linkError)

      // If user already exists, generate a recovery link instead
      if (linkError.message.includes('already been registered')) {
        const { data: recoveryData, error: recoveryError } = await adminClient.auth.admin.generateLink({
          type: 'recovery',
          email: member.email,
          options: {
            redirectTo: redirectUrl,
          },
        })

        if (recoveryError) {
          console.error('Error generating recovery link:', recoveryError)
          return { success: false, message: 'Error al generar el enlace de invitación' }
        }

        // Use the recovery link
        const invitationUrl = recoveryData.properties?.action_link
        if (!invitationUrl) {
          return { success: false, message: 'Error al generar el enlace' }
        }

        // Send the email
        const emailResult = await sendInvitationEmail(member.email, {
          memberName: member.full_name,
          gymName: organization.name,
          gymLogoUrl: organization.logo_url,
          invitationUrl,
          gymAddress: formatGymAddress(organization),
        })

        if (!emailResult.success) {
          return { success: false, message: emailResult.error ?? 'Error al enviar el correo' }
        }

        // Update member with invitation status and link to profile if we can find the user
        // For existing users, we need to find their user ID and link it
        const { data: usersList } = await adminClient.auth.admin.listUsers()
        const existingUser = usersList?.users?.find(u => u.email === member.email)

        if (existingUser?.id) {
          const userId = existingUser.id

          // Link member to profile
          await supabase
            .from('members')
            .update({
              user_id: userId,
              profile_id: userId,
              invitation_sent_at: new Date().toISOString(),
            } as never)
            .eq('id', memberId)

          // Update profile with organization_id if not set
          const dbRole = assignRole ? mapToDbRole(assignRole) : 'client'
          await supabase
            .from('profiles')
            .update({
              role: dbRole,
              organization_id: profile.organization_id,
            } as never)
            .eq('id', userId)
        } else {
          // Just update the invitation timestamp
          await supabase
            .from('members')
            .update({
              invitation_sent_at: new Date().toISOString(),
            } as never)
            .eq('id', memberId)
        }

        revalidatePath(`/dashboard/members/${memberId}`)
        return { success: true, message: 'Invitación reenviada correctamente' }
      }

      return { success: false, message: 'Error al generar el enlace de invitación' }
    }

    // 5. Get the invitation URL
    const invitationUrl = linkData.properties?.action_link
    if (!invitationUrl) {
      return { success: false, message: 'Error al generar el enlace de invitación' }
    }

    // 6. Link the auth user to the member record and update profile
    // IMPORTANT: This ensures that invited users:
    // - Have their member record linked to their profile (profile_id)
    // - Have their profile's organization_id set correctly
    // - Won't be redirected to onboarding after accepting the invitation
    if (linkData.user?.id) {
      const userId = linkData.user.id

      // Update member with user_id and profile_id in a single call
      await supabase
        .from('members')
        .update({
          user_id: userId,
          profile_id: userId,
          invitation_sent_at: new Date().toISOString(),
        } as never)
        .eq('id', memberId)

      // Wait a moment for the trigger to create the profile (if it hasn't yet)
      // Then update the profile with organization_id and role
      // We use a retry mechanism in case the profile isn't created yet
      const maxRetries = 3
      let profileUpdated = false

      for (let i = 0; i < maxRetries && !profileUpdated; i++) {
        if (i > 0) {
          // Wait 500ms before retrying
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        const dbRole = assignRole ? mapToDbRole(assignRole) : 'client'

        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({
            role: dbRole,
            organization_id: profile.organization_id,
          } as never)
          .eq('id', userId)

        if (!profileUpdateError) {
          profileUpdated = true
        } else {
          console.log(`Profile update attempt ${i + 1} failed:`, profileUpdateError.message)
        }
      }

      if (!profileUpdated) {
        console.error('Failed to update profile after retries for user:', userId)
        // Don't fail the invitation - the post-login redirect will fix this
      }
    }

    // 7. Send branded invitation email via Resend
    const emailResult = await sendInvitationEmail(member.email, {
      memberName: member.full_name,
      gymName: organization.name,
      gymLogoUrl: organization.logo_url,
      invitationUrl,
      gymAddress: formatGymAddress(organization),
    })

    if (!emailResult.success) {
      return { success: false, message: emailResult.error ?? 'Error al enviar el correo' }
    }

    revalidatePath(`/dashboard/members/${memberId}`)
    return { success: true, message: 'Invitación enviada correctamente' }

  } catch (err) {
    console.error('Invitation error:', err)
    return {
      success: false,
      message: 'Error al enviar la invitación',
      error: err instanceof Error ? err.message : 'Error desconocido',
    }
  }
}

// =============================================================================
// RESEND MEMBER INVITATION
// =============================================================================

/**
 * Resends an invitation email to a member
 * Preserves the current profile role when resending
 */
export async function resendMemberInvitation(
  memberId: string
): Promise<InvitationResult> {
  try {
    const supabase = await createClient()

    // Get member's profile_id to look up their current role
    const { data: memberData } = await supabase
      .from('members')
      .select('profile_id')
      .eq('id', memberId)
      .single()

    const member = memberData as { profile_id: string | null } | null

    // If member has a profile, get their current role and preserve it
    let currentRole: AppRole | undefined
    if (member?.profile_id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', member.profile_id)
        .single()

      const profile = profileData as { role: string } | null
      if (profile?.role) {
        const { mapLegacyRole } = await import('@/lib/rbac/helpers')
        currentRole = mapLegacyRole(profile.role)
      }
    }

    // Resend with the current role (or undefined if not found)
    return sendMemberInvitation(memberId, currentRole)
  } catch (err) {
    console.error('Resend invitation error:', err)
    return {
      success: false,
      message: 'Error al reenviar la invitación',
      error: err instanceof Error ? err.message : 'Error desconocido',
    }
  }
}

// =============================================================================
// SEND INVITATION ON MEMBER CREATE
// =============================================================================

/**
 * Creates a member and optionally sends an invitation
 * Used by the member creation form
 */
export async function createMemberWithInvitation(
  memberData: {
    email: string
    full_name: string
    phone?: string | null
    date_of_birth?: string | null
    gender?: string | null
    experience_level: string
    status: string
    current_plan_id?: string | null
    membership_start_date?: string | null
    membership_end_date?: string | null
    [key: string]: unknown
  },
  sendInvitation: boolean,
  assignRole?: AppRole
): Promise<{ success: boolean; message: string; memberId?: string }> {
  try {
    // 1. Verify user is authenticated
    const { profile, error: profileError } = await getUserProfile()
    if (profileError || !profile) {
      return { success: false, message: profileError ?? 'No autenticado' }
    }

    // 2. Check member limit
    const limitCheck = await checkMemberLimit(profile.organization_id)
    if (!limitCheck.allowed) {
      return { success: false, message: limitCheck.message || 'Límite de miembros alcanzado' }
    }

    // 3. Create the member
    const supabase = await createClient()
    const { data: memberResult, error: createError } = await supabase
      .from('members')
      .insert({
        ...memberData,
        organization_id: profile.organization_id,
      } as never)
      .select('id')
      .single()

    if (createError) {
      if (createError.code === '23505') {
        return { success: false, message: 'Ya existe un miembro con este email' }
      }
      return { success: false, message: createError.message }
    }

    const createdMember = memberResult as { id: string } | null

    // 4. Send invitation if requested
    if (sendInvitation && createdMember?.id) {
      const inviteResult = await sendMemberInvitation(createdMember.id, assignRole)
      if (!inviteResult.success) {
        // Member created but invitation failed - still return success with warning
        revalidatePath('/dashboard/members')
        return {
          success: true,
          message: `Miembro creado, pero hubo un error al enviar la invitación: ${inviteResult.message}`,
          memberId: createdMember.id,
        }
      }
    }

    revalidatePath('/dashboard/members')
    return {
      success: true,
      message: sendInvitation
        ? 'Miembro creado e invitación enviada correctamente'
        : 'Miembro creado exitosamente',
      memberId: createdMember?.id,
    }

  } catch (err) {
    console.error('Create member with invitation error:', err)
    return {
      success: false,
      message: 'Error al crear el miembro',
    }
  }
}
