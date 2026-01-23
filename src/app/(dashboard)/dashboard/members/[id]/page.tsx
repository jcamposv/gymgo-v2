import { notFound } from 'next/navigation'

import { getMemberWithPlan } from '@/actions/member.actions'
import { MemberDetailsContent } from './member-details-content'
import type { MemberExtended } from '@/types/member.types'

export const metadata = {
  title: 'Member Details | GymGo',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MemberDetailPage({ params }: PageProps) {
  const { id } = await params
  const { data: member, error } = await getMemberWithPlan(id)

  if (error || !member) {
    notFound()
  }

  // Extend the member with additional computed fields
  const memberExtended: MemberExtended = {
    ...member,
    // Computed fields (not in DB)
    client_id: parseInt(member.access_code?.replace(/\D/g, '') || '0') || undefined,
    // Gym name from organization
    gym_name: member.organization?.name || 'GymGo',
    // Plan data comes from the query (current_plan is already included)
  }

  // Reports and appointments will be implemented with real data in the future
  // For now, passing empty arrays to show empty states
  const reports: [] = []
  const upcomingAppointments: [] = []
  const pastAppointments: [] = []

  return (
    <MemberDetailsContent
      member={memberExtended}
      reports={reports}
      upcomingAppointments={upcomingAppointments}
      pastAppointments={pastAppointments}
    />
  )
}
