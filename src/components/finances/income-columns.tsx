'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Trash2 } from 'lucide-react'

import type { Income } from '@/actions/finance.actions'
import { deleteIncome } from '@/actions/finance.actions'
import { INCOME_CATEGORY_LABELS, type IncomeCategory } from '@/schemas/finance.schema'
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

export const incomeColumns: ColumnDef<Income>[] = [
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
      const income = row.original
      return (
        <div>
          <p className="font-medium">{income.description}</p>
          {income.notes && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {income.notes}
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
      const category = row.getValue('category') as IncomeCategory
      return (
        <Badge variant="outline">
          {INCOME_CATEGORY_LABELS[category] || category}
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
      const income = row.original
      return (
        <span className="font-medium text-green-600">
          +{formatCurrency(income.amount, { currency: income.currency })}
        </span>
      )
    },
  },
  // Created by column
  {
    accessorKey: 'created_by_profile',
    header: 'Registrado por',
    cell: ({ row }) => {
      const income = row.original
      return (
        <span className="text-muted-foreground">
          {income.created_by_profile?.full_name || '-'}
        </span>
      )
    },
  },
  // Actions column
  {
    id: 'actions',
    size: 50,
    cell: ({ row }) => <IncomeRowActions income={row.original} />,
  },
]

function IncomeRowActions({ income }: { income: Income }) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteIncome(income.id)
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
      onClick: () => router.push(`/dashboard/finances/income/${income.id}`),
    },
    {
      id: 'edit',
      label: 'Editar',
      icon: Pencil,
      onClick: () => router.push(`/dashboard/finances/income/${income.id}/edit`),
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
      <DataTableRowActions row={income} actions={actions} />
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar ingreso</AlertDialogTitle>
            <AlertDialogDescription>
              Esta seguro que desea eliminar el ingreso &quot;{income.description}&quot;?
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
