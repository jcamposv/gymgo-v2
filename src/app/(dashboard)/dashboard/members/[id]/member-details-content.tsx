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
  NoteFormDialog,
  NoteHistoryDialog,
} from '@/components/members'
import { useMemberMeasurements, useMemberNotes } from '@/hooks'
import { memberLabels, loadingLabels, toastMessages } from '@/lib/i18n'
import type {
  MemberExtended,
  MemberReport,
  MemberAppointment,
  MeasurementFormData,
} from '@/types/member.types'
import type { NoteFormData } from '@/actions/note.actions'

interface MemberDetailsContentProps {
  member: MemberExtended
  reports: MemberReport[]
  upcomingAppointments: MemberAppointment[]
  pastAppointments: MemberAppointment[]
}

export function MemberDetailsContent({
  member,
  reports,
  upcomingAppointments,
  pastAppointments,
}: MemberDetailsContentProps) {
  // Measurement state
  const [measurementDialogOpen, setMeasurementDialogOpen] = useState(false)
  const [measurementHistoryOpen, setMeasurementHistoryOpen] = useState(false)

  // Note state
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [noteHistoryOpen, setNoteHistoryOpen] = useState(false)

  // Measurements hook
  const {
    measurements,
    latestMeasurement,
    isLoading: isMeasurementsLoading,
    error: measurementsError,
    addMeasurement,
  } = useMemberMeasurements(member.id)

  // Notes hook
  const {
    notes,
    recentNotes,
    isLoading: isNotesLoading,
    error: notesError,
    addNote,
  } = useMemberNotes(member.id)

  // Measurement handlers
  const handleAddMeasurement = async (data: MeasurementFormData) => {
    const result = await addMeasurement(data)

    if (result.success) {
      toast.success(toastMessages.measurementSuccess)
      setMeasurementDialogOpen(false)
    } else {
      toast.error(result.error ?? toastMessages.measurementError)
      throw new Error(result.error ?? toastMessages.measurementError)
    }
  }

  // Note handlers
  const handleAddNote = async (data: NoteFormData) => {
    const result = await addNote(data)

    if (result.success) {
      toast.success(toastMessages.noteSuccess)
    } else {
      toast.error(result.error ?? toastMessages.noteError)
    }

    return result
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
          <MemberNotesList
            notes={recentNotes}
            isLoading={isNotesLoading}
            onAddNote={() => setNoteDialogOpen(true)}
            onViewAll={() => setNoteHistoryOpen(true)}
          />

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
              onViewHistory={() => setMeasurementHistoryOpen(true)}
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
        open={measurementHistoryOpen}
        onOpenChange={setMeasurementHistoryOpen}
        measurements={measurements}
        memberName={member.full_name}
        isLoading={isMeasurementsLoading}
        onAddMeasurement={() => setMeasurementDialogOpen(true)}
      />

      {/* Note Form Dialog */}
      <NoteFormDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        memberId={member.id}
        onSubmit={handleAddNote}
      />

      {/* Note History Dialog */}
      <NoteHistoryDialog
        open={noteHistoryOpen}
        onOpenChange={setNoteHistoryOpen}
        notes={notes}
        memberName={member.full_name}
        isLoading={isNotesLoading}
        onAddNote={() => setNoteDialogOpen(true)}
      />
    </div>
  )
}
