'use client'

import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

import type { Income } from '@/actions/finance.actions'
import { INCOME_CATEGORY_LABELS } from '@/schemas/finance.schema'
import { DataTable, type FilterConfig } from '@/components/data-table'
import { incomeColumns } from './income-columns'

interface IncomeDataTableProps {
  income: Income[]
  totalItems: number
}

// Define filters for income
const incomeFilters: FilterConfig[] = [
  {
    id: 'category',
    label: 'Categoria',
    type: 'select',
    options: Object.entries(INCOME_CATEGORY_LABELS).map(([value, label]) => ({
      label,
      value,
    })),
  },
]

export function IncomeDataTable({ income, totalItems }: IncomeDataTableProps) {
  const router = useRouter()

  return (
    <DataTable
      columns={incomeColumns}
      data={income}
      mode="server"
      totalItems={totalItems}
      defaultPageSize={20}
      searchable
      searchPlaceholder="Buscar por descripcion..."
      filters={incomeFilters}
      primaryAction={{
        id: 'new',
        label: 'Nuevo ingreso',
        icon: Plus,
        onClick: () => router.push('/dashboard/finances/income/new'),
      }}
      emptyTitle="No hay ingresos registrados"
      emptyDescription="Registra tu primer ingreso para comenzar"
    />
  )
}
