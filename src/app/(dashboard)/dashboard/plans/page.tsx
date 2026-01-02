import Link from 'next/link'
import { Plus, Search } from 'lucide-react'

import { getPlans } from '@/actions/plan.actions'
import { PlansTable } from '@/components/plans'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const metadata = {
  title: 'Planes | GymGo',
}

interface PageProps {
  searchParams: Promise<{
    query?: string
    is_active?: string
    billing_period?: string
    page?: string
  }>
}

export default async function PlansPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { data: plans, count, error } = await getPlans({
    query: params.query,
    is_active: params.is_active === 'true' ? true : params.is_active === 'false' ? false : undefined,
    billing_period: params.billing_period,
    page: params.page ? parseInt(params.page) : 1,
    per_page: 20,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planes de membresia</h1>
          <p className="text-muted-foreground">
            Gestiona los planes de membresia de tu gimnasio
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/plans/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo plan
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <form className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              name="query"
              placeholder="Buscar por nombre..."
              className="pl-8"
              defaultValue={params.query}
            />
          </div>
        </form>
        <Select name="is_active" defaultValue={params.is_active ?? 'all'}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Activos</SelectItem>
            <SelectItem value="false">Inactivos</SelectItem>
          </SelectContent>
        </Select>
        <Select name="billing_period" defaultValue={params.billing_period ?? 'all'}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="monthly">Mensual</SelectItem>
            <SelectItem value="quarterly">Trimestral</SelectItem>
            <SelectItem value="yearly">Anual</SelectItem>
            <SelectItem value="one_time">Pago unico</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : (
        <>
          <PlansTable plans={plans ?? []} />
          {count > 0 && (
            <p className="text-sm text-muted-foreground">
              Mostrando {plans?.length} de {count} planes
            </p>
          )}
        </>
      )}
    </div>
  )
}
