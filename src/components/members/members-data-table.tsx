'use client'

import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

import type { Tables } from '@/types/database.types'
import { memberStatuses, experienceLevels } from '@/schemas/member.schema'
import { DataTable, type FilterConfig } from '@/components/data-table'
import { memberColumns } from './members-columns'

interface MembersDataTableProps {
  members: Tables<'members'>[]
  totalItems: number
}

// Define filters for members
const memberFilters: FilterConfig[] = [
  {
    id: 'status',
    label: 'Estado',
    type: 'select',
    options: memberStatuses.map((s) => ({ label: s.label, value: s.value })),
  },
  {
    id: 'experience_level',
    label: 'Nivel',
    type: 'select',
    options: experienceLevels.map((l) => ({ label: l.label, value: l.value })),
  },
]

export function MembersDataTable({ members, totalItems }: MembersDataTableProps) {
  const router = useRouter()

  return (
    <DataTable
      columns={memberColumns}
      data={members}
      mode="server"
      totalItems={totalItems}
      defaultPageSize={20}
      searchable
      searchPlaceholder="Buscar por nombre o email..."
      filters={memberFilters}
      primaryAction={{
        id: 'new',
        label: 'Nuevo miembro',
        icon: Plus,
        onClick: () => router.push('/dashboard/members/new'),
      }}
      emptyTitle="No hay miembros registrados"
      emptyDescription="Crea tu primer miembro para comenzar"
    />
  )
}
