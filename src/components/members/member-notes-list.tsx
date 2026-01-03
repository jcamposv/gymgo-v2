'use client'

import { Plus } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { notesLabels, noteTypeLabels, formatNoteDate } from '@/lib/i18n'
import type { MemberNote } from '@/types/member.types'

// =============================================================================
// TYPES
// =============================================================================

interface MemberNotesListProps {
  notes: MemberNote[]
  className?: string
  isLoading?: boolean
  onAddNote?: () => void
  onViewAll?: () => void
}

// =============================================================================
// COMPONENT
// =============================================================================

export function MemberNotesList({
  notes,
  className,
  isLoading = false,
  onAddNote,
  onViewAll,
}: MemberNotesListProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{notesLabels.title}</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onAddNote}>
            <Plus className="h-4 w-4 mr-1" />
            {notesLabels.addNote}
          </Button>
          {notes.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              {notesLabels.viewAll}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : notes.length === 0 ? (
        <EmptyState onAddNote={onAddNote} />
      ) : (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  )
}

// =============================================================================
// NOTE CARD
// =============================================================================

interface NoteCardProps {
  note: MemberNote
}

function NoteCard({ note }: NoteCardProps) {
  return (
    <div className="min-w-[260px] max-w-[280px] shrink-0 rounded-lg bg-muted/50 p-4 space-y-2">
      <p className="text-xs text-muted-foreground">
        {formatNoteDate(note.created_at)}
      </p>
      <p className="text-sm font-semibold">{note.title}</p>
      <p className="text-sm text-muted-foreground whitespace-normal line-clamp-3">
        {note.content}
      </p>
      {note.created_by_name && (
        <p className="text-xs text-muted-foreground">
          {notesLabels.by} {note.created_by_name}
        </p>
      )}
    </div>
  )
}

// =============================================================================
// EMPTY STATE
// =============================================================================

interface EmptyStateProps {
  onAddNote?: () => void
}

function EmptyState({ onAddNote }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <p className="text-sm text-muted-foreground">{notesLabels.noNotesDescription}</p>
      {onAddNote && (
        <Button variant="outline" size="sm" onClick={onAddNote}>
          <Plus className="h-4 w-4 mr-2" />
          {notesLabels.addFirstNote}
        </Button>
      )}
    </div>
  )
}
