'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  MemberHeaderCard,
  MemberContactInfoCard,
  MemberGeneralInfoCard,
  MemberNotesList,
  MemberMedicalInfoCard,
  MembershipCard,
  FitnessReportsCard,
  AppointmentCard,
  MeasurementFormDialog,
  MeasurementHistoryDialog,
} from '@/components/members'
import { useMemberMeasurements } from '@/hooks'
import { memberLabels, loadingLabels, toastMessages } from '@/lib/i18n'
import type {
  MemberExtended,
  MemberNote,
  MemberReport,
  MemberAppointment,
  MeasurementFormData,
} from '@/types/member.types'

interface MemberDetailsContentProps {
  member: MemberExtended
  notes: MemberNote[]
  reports: MemberReport[]
  upcomingAppointments: MemberAppointment[]
  pastAppointments: MemberAppointment[]
}

export function MemberDetailsContent({
  member,
  notes,
  reports,
  upcomingAppointments,
  pastAppointments,
}: MemberDetailsContentProps) {
  const [measurementDialogOpen, setMeasurementDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)

  // Use the hook to fetch and manage measurements
  const {
    measurements,
    latestMeasurement,
    isLoading: isMeasurementsLoading,
    error: measurementsError,
    addMeasurement,
  } = useMemberMeasurements(member.id)

  const handleAddMeasurement = async (data: MeasurementFormData) => {
    const result = await addMeasurement(data)

    if (result.success) {
      toast.success(toastMessages.measurementSuccess)
      setMeasurementDialogOpen(false)
    } else {
      // Don't close the dialog on error - let the dialog handle showing the error
      toast.error(result.error ?? toastMessages.measurementError)
      throw new Error(result.error ?? toastMessages.measurementError)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/members">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground">{memberLabels.backToMembers}</span>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Left column - Main content */}
        <div className="space-y-6">
          {/* Header Card */}
          <MemberHeaderCard member={member} />

          {/* Contact + General Info Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MemberContactInfoCard member={member} />
            <MemberGeneralInfoCard member={member} />
          </div>

          {/* Client Notes */}
          <MemberNotesList notes={notes} onViewAll={() => {}} />

          {/* Medical Info - with loading state */}
          {isMeasurementsLoading ? (
            <div className="flex items-center justify-center p-8 border rounded-lg bg-muted/30">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">{loadingLabels.loadingMeasurements}</span>
            </div>
          ) : measurementsError ? (
            <div className="flex items-center justify-center p-8 border rounded-lg bg-destructive/10">
              <span className="text-sm text-destructive">{measurementsError}</span>
            </div>
          ) : (
            <MemberMedicalInfoCard
              measurement={latestMeasurement}
              onAddMeasurement={() => setMeasurementDialogOpen(true)}
              onViewHistory={() => setHistoryDialogOpen(true)}
            />
          )}
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-6">
          {/* Membership Card */}
          <MembershipCard member={member} />

          {/* Fitness Reports */}
          <FitnessReportsCard reports={reports} />

          {/* Appointments */}
          <AppointmentCard
            upcomingAppointments={upcomingAppointments}
            pastAppointments={pastAppointments}
          />
        </div>
      </div>

      {/* Measurement Dialog */}
      <MeasurementFormDialog
        open={measurementDialogOpen}
        onOpenChange={setMeasurementDialogOpen}
        memberId={member.id}
        onSubmit={handleAddMeasurement}
      />

      {/* Measurement History Dialog */}
      <MeasurementHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        measurements={measurements}
        memberName={member.full_name}
        isLoading={isMeasurementsLoading}
        onAddMeasurement={() => setMeasurementDialogOpen(true)}
      />
    </div>
  )
}
