import { notFound } from 'next/navigation'

import { getMemberWithPlan } from '@/actions/member.actions'
import { MemberDetailsContent } from './member-details-content'
import {
  mockReports,
  mockUpcomingAppointments,
  mockPastAppointments,
} from '@/lib/member.mocks'
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

  // TODO: These will be replaced with real API calls in the future
  // For now, using mock data for reports and appointments
  // Notes are now fetched via useMemberNotes hook in the client component
  // Measurements are fetched via useMemberMeasurements hook in the client component
  const reports = mockReports
  const upcomingAppointments = mockUpcomingAppointments
  const pastAppointments = mockPastAppointments

  return (
    <MemberDetailsContent
      member={memberExtended}
      reports={reports}
      upcomingAppointments={upcomingAppointments}
      pastAppointments={pastAppointments}
    />
  )
}
