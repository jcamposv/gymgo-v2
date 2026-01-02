'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Trash2, Power, Users } from 'lucide-react'

import type { Tables } from '@/types/database.types'
import { dayOfWeekLabels, classTypeLabels } from '@/schemas/template.schema'
import { deleteClassTemplate, toggleTemplateStatus } from '@/actions/template.actions'

import { Badge } from '@/components/ui/badge'
import {
  DataTableColumnHeader,
  DataTableRowActions,
  StatusBadge,
} from '@/components/data-table'

type ClassTemplate = Tables<'class_templates'>

export const templateColumns: ColumnDef<ClassTemplate>[] = [
  // Name & Type column
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Clase" />
    ),
    cell: ({ row }) => {
      const template = row.original
      return (
        <div>
          <div className="font-medium">{template.name}</div>
          {template.class_type && (
            <div className="text-sm text-muted-foreground">
              {classTypeLabels[template.class_type] || template.class_type}
            </div>
          )}
        </div>
      )
    },
  },
  // Day of week column
  {
    accessorKey: 'day_of_week',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Dia" />
    ),
    cell: ({ row }) => {
      const dayOfWeek = row.getValue('day_of_week') as number
      return (
        <Badge variant="outline">
          {dayOfWeekLabels[dayOfWeek]}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(String(row.getValue(id)))
    },
  },
  // Schedule column
  {
    accessorKey: 'start_time',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Horario" />
    ),
    cell: ({ row }) => {
      const template = row.original
      return (
        <span>
          {template.start_time} - {template.end_time}
        </span>
      )
    },
  },
  // Instructor column
  {
    accessorKey: 'instructor_name',
    header: 'Instructor',
    cell: ({ row }) => {
      const instructor = row.getValue('instructor_name') as string | null
      return instructor ?? <span className="text-muted-foreground">-</span>
    },
  },
  // Capacity column
  {
    accessorKey: 'max_capacity',
    header: 'Capacidad',
    cell: ({ row }) => {
      const template = row.original
      return (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{template.max_capacity}</span>
          {template.waitlist_enabled && (
            <span className="text-muted-foreground text-sm">(+espera)</span>
          )}
        </div>
      )
    },
  },
  // Status column
  {
    accessorKey: 'is_active',
    header: 'Estado',
    cell: ({ row }) => {
      const isActive = row.getValue('is_active') as boolean
      return (
        <StatusBadge variant={isActive ? 'success' : 'default'} dot>
          {isActive ? 'Activa' : 'Inactiva'}
        </StatusBadge>
      )
    },
    filterFn: (row, id, value) => {
      const isActive = row.getValue(id) as boolean
      if (value === 'active') return isActive
      if (value === 'inactive') return !isActive
      return true
    },
  },
  // Actions column
  {
    id: 'actions',
    size: 50,
    cell: ({ row }) => <TemplateRowActions template={row.original} />,
  },
]

function TemplateRowActions({ template }: { template: ClassTemplate }) {
  const router = useRouter()

  const handleDelete = async () => {
    const result = await deleteClassTemplate(template.id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const handleToggleStatus = async () => {
    const result = await toggleTemplateStatus(template.id)
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
      onClick: () => router.push(`/dashboard/templates/${template.id}`),
    },
    {
      id: 'edit',
      label: 'Editar',
      icon: Pencil,
      onClick: () => router.push(`/dashboard/templates/${template.id}/edit`),
    },
    {
      id: 'toggle',
      label: template.is_active ? 'Desactivar' : 'Activar',
      icon: Power,
      onClick: handleToggleStatus,
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: Trash2,
      onClick: handleDelete,
      variant: 'destructive' as const,
    },
  ]

  return <DataTableRowActions row={template} actions={actions} />
}
