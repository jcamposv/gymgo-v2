'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { notesLabels, formatNoteDate } from '@/lib/i18n'
import type { MemberNote } from '@/types/member.types'

interface MemberNotesListProps {
  notes: MemberNote[]
  className?: string
  onViewAll?: () => void
}

const noteTypeStyles: Record<string, string> = {
  notes: 'border-l-gray-400',
  trainer_comments: 'border-l-blue-400',
  progress: 'border-l-green-400',
  medical: 'border-l-red-400',
  general: 'border-l-gray-400',
}

export function MemberNotesList({ notes, className, onViewAll }: MemberNotesListProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{notesLabels.title}</h3>
        <Button variant="ghost" size="sm" onClick={onViewAll}>
          {notesLabels.viewAll}
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">{notesLabels.noNotes}</p>
          ) : (
            notes.map((note) => (
              <Card
                key={note.id}
                className={cn(
                  'min-w-[260px] max-w-[280px] border-l-4 shrink-0',
                  noteTypeStyles[note.type]
                )}
              >
                <CardHeader className="pb-2 pt-4 px-4">
                  <p className="text-xs text-muted-foreground">
                    {formatNoteDate(note.created_at)}
                  </p>
                  <CardTitle className="text-sm font-semibold">{note.title}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-sm text-muted-foreground whitespace-normal line-clamp-3">
                    {note.content}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
