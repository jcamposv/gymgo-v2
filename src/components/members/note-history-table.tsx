'use client'

import type { ColumnDef } from '@tanstack/react-table'

import { DataTable, DataTableColumnHeader } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { noteHistoryLabels, noteTypeLabels, formatNoteDate } from '@/lib/i18n'
import type { MemberNote } from '@/types/member.types'

// =============================================================================
// NOTE TYPE BADGE STYLES
// =============================================================================

const noteTypeBadgeStyles: Record<string, string> = {
  notes: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  trainer_comments: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  progress: 'bg-green-100 text-green-700 hover:bg-green-100',
  medical: 'bg-red-100 text-red-700 hover:bg-red-100',
  general: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
}

// =============================================================================
// COLUMNS
// =============================================================================

const labels = noteHistoryLabels

const noteColumns: ColumnDef<MemberNote>[] = [
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={labels.dateColumn} />
    ),
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string
      return <span className="text-sm whitespace-nowrap">{formatNoteDate(date)}</span>
    },
    size: 140,
  },
  {
    accessorKey: 'type',
    header: () => <span>{labels.typeColumn}</span>,
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      return (
        <Badge className={noteTypeBadgeStyles[type] || noteTypeBadgeStyles.general}>
          {noteTypeLabels[type] || type}
        </Badge>
      )
    },
    size: 150,
  },
  {
    accessorKey: 'title',
    header: () => <span>{labels.titleColumn}</span>,
    cell: ({ row }) => {
      const title = row.getValue('title') as string
      return <span className="font-medium">{title}</span>
    },
  },
  {
    accessorKey: 'content',
    header: () => <span>{labels.contentColumn}</span>,
    cell: ({ row }) => {
      const content = row.getValue('content') as string
      // Truncate long content
      const truncated = content.length > 100 ? content.slice(0, 100) + '...' : content
      return (
        <span className="text-sm text-muted-foreground" title={content}>
          {truncated}
        </span>
      )
    },
  },
  {
    accessorKey: 'created_by_name',
    header: () => <span>{labels.authorColumn}</span>,
    cell: ({ row }) => {
      const author = row.getValue('created_by_name') as string | null
      return <span className="text-sm">{author || '-'}</span>
    },
    size: 120,
  },
]

// =============================================================================
// COMPONENT
// =============================================================================

interface NoteHistoryTableProps {
  notes: MemberNote[]
}

export function NoteHistoryTable({ notes }: NoteHistoryTableProps) {
  return (
    <DataTable
      columns={noteColumns}
      data={notes}
      mode="client"
      defaultPageSize={10}
      pageSizeOptions={[5, 10, 20]}
      sortable={true}
      defaultSort={[{ id: 'created_at', desc: true }]}
      enableMobileCards={false}
      emptyTitle={labels.noNotes}
      emptyDescription={labels.noNotesDescription}
    />
  )
}
