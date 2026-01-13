'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Trash2 } from 'lucide-react'

import type { Payment } from '@/actions/finance.actions'
import { deletePayment } from '@/actions/finance.actions'
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type PaymentMethod,
  type PaymentStatus,
} from '@/schemas/finance.schema'
import { formatCurrency } from '@/lib/utils'

import { Badge } from '@/components/ui/badge'
import {
  DataTableColumnHeader,
  DataTableRowActions,
} from '@/components/data-table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const getStatusVariant = (status: PaymentStatus) => {
  switch (status) {
    case 'paid':
      return 'default'
    case 'pending':
      return 'secondary'
    case 'failed':
      return 'destructive'
    case 'refunded':
      return 'outline'
    default:
      return 'secondary'
  }
}

export const paymentColumns: ColumnDef<Payment>[] = [
  // Date column
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fecha" />
    ),
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string
      return (
        <span className="text-sm">
          {format(new Date(date), 'dd MMM yyyy', { locale: es })}
        </span>
      )
    },
  },
  // Member column
  {
    accessorKey: 'member',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Miembro" />
    ),
    cell: ({ row }) => {
      const payment = row.original
      return (
        <div>
          <p className="font-medium">{payment.member?.full_name || '-'}</p>
          <p className="text-xs text-muted-foreground">
            {payment.member?.email || '-'}
          </p>
        </div>
      )
    },
  },
  // Plan column
  {
    accessorKey: 'plan',
    header: 'Plan',
    cell: ({ row }) => {
      const payment = row.original
      return (
        <span className="text-muted-foreground">
          {payment.plan?.name || '-'}
        </span>
      )
    },
  },
  // Amount column
  {
    accessorKey: 'amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Monto" />
    ),
    cell: ({ row }) => {
      const payment = row.original
      return (
        <span className="font-medium">
          {formatCurrency(payment.amount, { currency: payment.currency })}
        </span>
      )
    },
  },
  // Method column
  {
    accessorKey: 'payment_method',
    header: 'Metodo',
    cell: ({ row }) => {
      const method = row.getValue('payment_method') as PaymentMethod
      return (
        <span className="text-muted-foreground">
          {PAYMENT_METHOD_LABELS[method] || method}
        </span>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  // Status column
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.getValue('status') as PaymentStatus
      return (
        <Badge variant={getStatusVariant(status)}>
          {PAYMENT_STATUS_LABELS[status] || status}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  // Created by column
  {
    accessorKey: 'created_by_profile',
    header: 'Registrado por',
    cell: ({ row }) => {
      const payment = row.original
      return (
        <span className="text-muted-foreground">
          {payment.created_by_profile?.full_name || '-'}
        </span>
      )
    },
  },
  // Actions column
  {
    id: 'actions',
    size: 50,
    cell: ({ row }) => <PaymentRowActions payment={row.original} />,
  },
]

function PaymentRowActions({ payment }: { payment: Payment }) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deletePayment(payment.id)
    setIsDeleting(false)

    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
    setShowDeleteDialog(false)
  }

  const actions = [
    {
      id: 'view',
      label: 'Ver detalles',
      icon: Eye,
      onClick: () => router.push(`/dashboard/finances/payments/${payment.id}`),
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
      <DataTableRowActions row={payment} actions={actions} />
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar pago</AlertDialogTitle>
            <AlertDialogDescription>
              Esta seguro que desea eliminar este pago de{' '}
              {formatCurrency(payment.amount, { currency: payment.currency })}?
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
