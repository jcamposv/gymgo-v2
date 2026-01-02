'use client'

import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

import type { Tables } from '@/types/database.types'
import { classTypes } from '@/schemas/class.schema'
import { DataTable, type FilterConfig } from '@/components/data-table'
import { classColumns } from './classes-columns'

interface ClassesDataTableProps {
  classes: Tables<'classes'>[]
  totalItems: number
}

// Define filters for classes
const classFilters: FilterConfig[] = [
  {
    id: 'class_type',
    label: 'Tipo',
    type: 'select',
    options: classTypes.map((t) => ({ label: t.label, value: t.value })),
  },
  {
    id: 'status',
    label: 'Estado',
    type: 'select',
    options: [
      { label: 'Activa', value: 'active' },
      { label: 'Finalizada', value: 'finished' },
      { label: 'Cancelada', value: 'cancelled' },
    ],
  },
]

export function ClassesDataTable({ classes, totalItems }: ClassesDataTableProps) {
  const router = useRouter()

  return (
    <DataTable
      columns={classColumns}
      data={classes}
      mode="server"
      totalItems={totalItems}
      defaultPageSize={20}
      searchable
      searchPlaceholder="Buscar clases..."
      filters={classFilters}
      primaryAction={{
        id: 'new',
        label: 'Nueva clase',
        icon: Plus,
        onClick: () => router.push('/dashboard/classes/new'),
      }}
      emptyTitle="No hay clases programadas"
      emptyDescription="Crea tu primera clase para comenzar"
    />
  )
}
