'use client'

import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

import type { Expense } from '@/actions/finance.actions'
import { EXPENSE_CATEGORY_LABELS } from '@/schemas/finance.schema'
import { DataTable, type FilterConfig } from '@/components/data-table'
import { expenseColumns } from './expenses-columns'

interface ExpensesDataTableProps {
  expenses: Expense[]
  totalItems: number
}

// Define filters for expenses
const expenseFilters: FilterConfig[] = [
  {
    id: 'category',
    label: 'Categoria',
    type: 'select',
    options: Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => ({
      label,
      value,
    })),
  },
]

export function ExpensesDataTable({ expenses, totalItems }: ExpensesDataTableProps) {
  const router = useRouter()

  return (
    <DataTable
      columns={expenseColumns}
      data={expenses}
      mode="server"
      totalItems={totalItems}
      defaultPageSize={20}
      searchable
      searchPlaceholder="Buscar por descripcion..."
      filters={expenseFilters}
      primaryAction={{
        id: 'new',
        label: 'Nuevo gasto',
        icon: Plus,
        onClick: () => router.push('/dashboard/finances/expenses/new'),
      }}
      emptyTitle="No hay gastos registrados"
      emptyDescription="Registra tu primer gasto para comenzar"
    />
  )
}
