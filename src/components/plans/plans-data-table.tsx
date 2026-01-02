'use client'

import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

import { billingPeriods } from '@/schemas/plan.schema'
import { DataTable, type FilterConfig } from '@/components/data-table'
import { planColumns } from './plans-columns'

interface Plan {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  billing_period: string
  unlimited_access: boolean
  classes_per_period: number | null
  access_all_locations: boolean
  duration_days: number
  features: string[]
  is_active: boolean
  is_featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface PlansDataTableProps {
  plans: Plan[]
  totalItems: number
}

// Define filters for plans
const planFilters: FilterConfig[] = [
  {
    id: 'billing_period',
    label: 'Periodo',
    type: 'select',
    options: billingPeriods.map((p) => ({ label: p.label, value: p.value })),
  },
  {
    id: 'is_active',
    label: 'Estado',
    type: 'select',
    options: [
      { label: 'Activo', value: 'true' },
      { label: 'Inactivo', value: 'false' },
    ],
  },
]

export function PlansDataTable({ plans, totalItems }: PlansDataTableProps) {
  const router = useRouter()

  return (
    <DataTable
      columns={planColumns}
      data={plans}
      mode="server"
      totalItems={totalItems}
      defaultPageSize={20}
      searchable
      searchPlaceholder="Buscar planes..."
      filters={planFilters}
      primaryAction={{
        id: 'new',
        label: 'Nuevo plan',
        icon: Plus,
        onClick: () => router.push('/dashboard/plans/new'),
      }}
      emptyTitle="No hay planes de membresia"
      emptyDescription="Crea tu primer plan para comenzar"
    />
  )
}
