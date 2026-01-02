'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Trash2, Power, Star } from 'lucide-react'

import { deletePlan, togglePlanStatus } from '@/actions/plan.actions'
import { billingPeriodLabels } from '@/schemas/plan.schema'

import { Badge } from '@/components/ui/badge'
import {
  DataTableColumnHeader,
  DataTableRowActions,
  StatusBadge,
} from '@/components/data-table'

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

const formatPrice = (price: number, currency: string) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
  }).format(price)
}

export const planColumns: ColumnDef<Plan>[] = [
  // Name column
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Plan" />
    ),
    cell: ({ row }) => {
      const plan = row.original
      return (
        <div className="flex items-center gap-2">
          <div>
            <div className="font-medium flex items-center gap-2">
              {plan.name}
              {plan.is_featured && (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              )}
            </div>
            {plan.description && (
              <div className="text-sm text-muted-foreground line-clamp-1 max-w-[250px]">
                {plan.description}
              </div>
            )}
          </div>
        </div>
      )
    },
  },
  // Price column
  {
    accessorKey: 'price',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Precio" />
    ),
    cell: ({ row }) => {
      const plan = row.original
      return (
        <span className="font-medium">
          {formatPrice(plan.price, plan.currency)}
        </span>
      )
    },
  },
  // Billing period column
  {
    accessorKey: 'billing_period',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Periodo" />
    ),
    cell: ({ row }) => {
      const period = row.getValue('billing_period') as string
      return (
        <Badge variant="outline">
          {billingPeriodLabels[period] || period}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  // Duration column
  {
    accessorKey: 'duration_days',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Duracion" />
    ),
    cell: ({ row }) => {
      const days = row.getValue('duration_days') as number
      return <span>{days} dias</span>
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
          {isActive ? 'Activo' : 'Inactivo'}
        </StatusBadge>
      )
    },
  },
  // Created date column
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Creado" />
    ),
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string
      return (
        <span className="text-sm text-muted-foreground">
          {format(new Date(date), 'dd MMM yyyy', { locale: es })}
        </span>
      )
    },
  },
  // Actions column
  {
    id: 'actions',
    size: 50,
    cell: ({ row }) => <PlanRowActions plan={row.original} />,
  },
]

function PlanRowActions({ plan }: { plan: Plan }) {
  const router = useRouter()

  const handleDelete = async () => {
    const result = await deletePlan(plan.id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const handleToggleStatus = async () => {
    const result = await togglePlanStatus(plan.id)
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
      onClick: () => router.push(`/dashboard/plans/${plan.id}`),
    },
    {
      id: 'edit',
      label: 'Editar',
      icon: Pencil,
      onClick: () => router.push(`/dashboard/plans/${plan.id}/edit`),
    },
    {
      id: 'toggle',
      label: plan.is_active ? 'Desactivar' : 'Activar',
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

  return <DataTableRowActions row={plan} actions={actions} />
}
