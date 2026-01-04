'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Trash2, UserCheck, UserX } from 'lucide-react'

import type { Tables, MemberStatus } from '@/types/database.types'
import { updateMemberStatus } from '@/actions/member.actions'
import {
  memberStatusLabels,
  experienceLevelLabels,
} from '@/schemas/member.schema'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DataTableColumnHeader,
  DataTableRowActions,
  StatusBadge,
} from '@/components/data-table'
import { DeleteMemberDialog } from './delete-member-dialog'

type Member = Tables<'members'>

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getStatusVariant = (status: MemberStatus) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'default'
    case 'suspended':
      return 'warning'
    case 'cancelled':
      return 'error'
    default:
      return 'default'
  }
}

export const memberColumns: ColumnDef<Member>[] = [
  // Member column (avatar + name + email)
  {
    accessorKey: 'full_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Miembro" />
    ),
    cell: ({ row }) => {
      const member = row.original
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-xs">
              {getInitials(member.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{member.full_name}</div>
            <div className="text-sm text-muted-foreground">{member.email}</div>
          </div>
        </div>
      )
    },
  },
  // Status column
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.getValue('status') as MemberStatus
      return (
        <StatusBadge variant={getStatusVariant(status)} dot>
          {memberStatusLabels[status]}
        </StatusBadge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  // Experience level column
  {
    accessorKey: 'experience_level',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nivel" />
    ),
    cell: ({ row }) => {
      const level = row.getValue('experience_level') as string
      return (
        <span className="capitalize">
          {experienceLevelLabels[level] || level}
        </span>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  // Check-ins column
  {
    accessorKey: 'check_in_count',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Check-ins" />
    ),
    cell: ({ row }) => {
      const count = row.getValue('check_in_count') as number
      return <span>{count}</span>
    },
  },
  // Member since column
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Miembro desde" />
    ),
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string
      return (
        <span className="text-sm text-muted-foreground">
          {format(new Date(date), 'dd MMM yyyy', { locale: es })}
        </span>
      )
    },
  },
  // Actions column
  {
    id: 'actions',
    size: 50,
    cell: ({ row }) => <MemberRowActions member={row.original} />,
  },
]

function MemberRowActions({ member }: { member: Member }) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleStatusChange = async (status: MemberStatus) => {
    const result = await updateMemberStatus(member.id, status)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const actions = [
    {
      id: 'view',
      label: 'Ver detalles',
      icon: Eye,
      onClick: () => router.push(`/dashboard/members/${member.id}`),
    },
    {
      id: 'edit',
      label: 'Editar',
      icon: Pencil,
      onClick: () => router.push(`/dashboard/members/${member.id}/edit`),
    },
    {
      id: 'activate',
      label: 'Activar',
      icon: UserCheck,
      onClick: () => handleStatusChange('active'),
      hidden: member.status === 'active',
    },
    {
      id: 'suspend',
      label: 'Suspender',
      icon: UserX,
      onClick: () => handleStatusChange('suspended'),
      hidden: member.status !== 'active',
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: Trash2,
      onClick: () => setShowDeleteDialog(true),
      variant: 'destructive' as const,
    },
  ]

  return (
    <>
      <DataTableRowActions row={member} actions={actions} />
      <DeleteMemberDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        member={{
          id: member.id,
          full_name: member.full_name,
          email: member.email,
          profile_id: member.profile_id,
        }}
      />
    </>
  )
}
