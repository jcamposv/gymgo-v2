'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Trash2 } from 'lucide-react'

import type { Expense } from '@/actions/finance.actions'
import { deleteExpense } from '@/actions/finance.actions'
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '@/schemas/finance.schema'
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

export const expenseColumns: ColumnDef<Expense>[] = [
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
  // Description column
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Descripcion" />
    ),
    cell: ({ row }) => {
      const expense = row.original
      return (
        <div>
          <p className="font-medium">{expense.description}</p>
          {expense.notes && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {expense.notes}
            </p>
          )}
        </div>
      )
    },
  },
  // Category column
  {
    accessorKey: 'category',
    header: 'Categoria',
    cell: ({ row }) => {
      const category = row.getValue('category') as ExpenseCategory
      return (
        <Badge variant="outline">
          {EXPENSE_CATEGORY_LABELS[category] || category}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  // Amount column
  {
    accessorKey: 'amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Monto" />
    ),
    cell: ({ row }) => {
      const expense = row.original
      return (
        <span className="font-medium text-red-600">
          -{formatCurrency(expense.amount, { currency: expense.currency })}
        </span>
      )
    },
  },
  // Vendor column
  {
    accessorKey: 'vendor',
    header: 'Proveedor',
    cell: ({ row }) => {
      const vendor = row.getValue('vendor') as string | null
      return (
        <span className="text-muted-foreground">
          {vendor || '-'}
        </span>
      )
    },
  },
  // Recurring column
  {
    accessorKey: 'is_recurring',
    header: 'Recurrente',
    cell: ({ row }) => {
      const isRecurring = row.getValue('is_recurring') as boolean
      return isRecurring ? (
        <Badge variant="secondary">Si</Badge>
      ) : (
        <span className="text-muted-foreground">No</span>
      )
    },
  },
  // Created by column
  {
    accessorKey: 'created_by_profile',
    header: 'Registrado por',
    cell: ({ row }) => {
      const expense = row.original
      return (
        <span className="text-muted-foreground">
          {expense.created_by_profile?.full_name || '-'}
        </span>
      )
    },
  },
  // Actions column
  {
    id: 'actions',
    size: 50,
    cell: ({ row }) => <ExpenseRowActions expense={row.original} />,
  },
]

function ExpenseRowActions({ expense }: { expense: Expense }) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteExpense(expense.id)
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
      onClick: () => router.push(`/dashboard/finances/expenses/${expense.id}`),
    },
    {
      id: 'edit',
      label: 'Editar',
      icon: Pencil,
      onClick: () => router.push(`/dashboard/finances/expenses/${expense.id}/edit`),
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
      <DataTableRowActions row={expense} actions={actions} />
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar gasto</AlertDialogTitle>
            <AlertDialogDescription>
              Esta seguro que desea eliminar el gasto &quot;{expense.description}&quot;?
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
