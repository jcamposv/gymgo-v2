'use client'

import { Loader2, Plus, FileText } from 'lucide-react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { NoteHistoryTable } from './note-history-table'
import { noteHistoryLabels } from '@/lib/i18n'
import type { MemberNote } from '@/types/member.types'

// =============================================================================
// TYPES
// =============================================================================

interface NoteHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notes: MemberNote[]
  memberName?: string
  isLoading?: boolean
  onAddNote?: () => void
}

// =============================================================================
// COMPONENT
// =============================================================================

export function NoteHistoryDialog({
  open,
  onOpenChange,
  notes,
  memberName,
  isLoading = false,
  onAddNote,
}: NoteHistoryDialogProps) {
  const labels = noteHistoryLabels

  const handleAddNote = () => {
    onOpenChange(false)
    onAddNote?.()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {labels.title}
          </SheetTitle>
          <SheetDescription>
            {memberName ? `${memberName} - ` : ''}{labels.description}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <EmptyState onAddNote={handleAddNote} />
        ) : (
          <div className="flex flex-col gap-4 mt-6 px-4 pb-4 overflow-y-auto">
            {/* Add Note Button */}
            <div className="flex justify-end">
              <Button size="sm" onClick={handleAddNote}>
                <Plus className="h-4 w-4 mr-2" />
                {labels.addFirstNote}
              </Button>
            </div>

            {/* Notes Table with Pagination */}
            <div className="overflow-x-auto">
              <NoteHistoryTable notes={notes} />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// =============================================================================
// EMPTY STATE
// =============================================================================

interface EmptyStateProps {
  onAddNote: () => void
}

function EmptyState({ onAddNote }: EmptyStateProps) {
  const labels = noteHistoryLabels

  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-sm font-medium">{labels.noNotes}</p>
        <p className="text-sm text-muted-foreground">{labels.noNotesDescription}</p>
      </div>
      <Button onClick={onAddNote}>
        <Plus className="h-4 w-4 mr-2" />
        {labels.addFirstNote}
      </Button>
    </div>
  )
}
