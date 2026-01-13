'use client'

import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

import type { Payment } from '@/actions/finance.actions'
import { PAYMENT_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/schemas/finance.schema'
import { DataTable, type FilterConfig } from '@/components/data-table'
import { paymentColumns } from './payments-columns'

interface PaymentsDataTableProps {
  payments: Payment[]
  totalItems: number
}

// Define filters for payments
const paymentFilters: FilterConfig[] = [
  {
    id: 'status',
    label: 'Estado',
    type: 'select',
    options: Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({
      label,
      value,
    })),
  },
  {
    id: 'payment_method',
    label: 'Metodo',
    type: 'select',
    options: Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
      label,
      value,
    })),
  },
]

export function PaymentsDataTable({ payments, totalItems }: PaymentsDataTableProps) {
  const router = useRouter()

  return (
    <DataTable
      columns={paymentColumns}
      data={payments}
      mode="server"
      totalItems={totalItems}
      defaultPageSize={20}
      searchable
      searchPlaceholder="Buscar por miembro..."
      filters={paymentFilters}
      primaryAction={{
        id: 'new',
        label: 'Nuevo pago',
        icon: Plus,
        onClick: () => router.push('/dashboard/finances/payments/new'),
      }}
      emptyTitle="No hay pagos registrados"
      emptyDescription="Registra tu primer pago para comenzar"
    />
  )
}
