import { notFound } from 'next/navigation'

import { getMember } from '@/actions/member.actions'
import { MemberDetailsContent } from './member-details-content'
import {
  mockNotes,
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
  const { data: member, error } = await getMember(id)

  if (error || !member) {
    notFound()
  }

  // Extend the member with additional computed/mock fields
  const memberExtended: MemberExtended = {
    ...member,
    // Computed fields (not in DB)
    client_id: parseInt(member.access_code?.replace(/\D/g, '') || '0') || undefined,
    // Membership info (not in DB - will come from organization/plan later)
    membership_tier: 'blue',
    gym_name: 'WellNest GymGo',
  }

  // TODO: These will be replaced with real API calls in the future
  // For now, using mock data for notes, reports, and appointments
  // Measurements are now fetched via useMemberMeasurements hook in the client component
  const notes = mockNotes
  const reports = mockReports
  const upcomingAppointments = mockUpcomingAppointments
  const pastAppointments = mockPastAppointments

  return (
    <MemberDetailsContent
      member={memberExtended}
      notes={notes}
      reports={reports}
      upcomingAppointments={upcomingAppointments}
      pastAppointments={pastAppointments}
    />
  )
}
