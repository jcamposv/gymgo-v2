import Link from 'next/link'
import { Plus, Search } from 'lucide-react'

import { getMembers } from '@/actions/member.actions'
import { MembersTable } from '@/components/members'
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
  title: 'Miembros | GymGo',
}

interface PageProps {
  searchParams: Promise<{
    query?: string
    status?: string
    page?: string
  }>
}

export default async function MembersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { data: members, count, error } = await getMembers({
    query: params.query,
    status: params.status as 'active' | 'inactive' | 'suspended' | 'cancelled' | undefined,
    page: params.page ? parseInt(params.page) : 1,
    per_page: 20,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Miembros</h1>
          <p className="text-muted-foreground">
            Gestiona los miembros de tu gimnasio
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/members/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo miembro
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <form className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              name="query"
              placeholder="Buscar por nombre o email..."
              className="pl-8"
              defaultValue={params.query}
            />
          </div>
        </form>
        <Select name="status" defaultValue={params.status ?? 'all'}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
            <SelectItem value="suspended">Suspendidos</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : (
        <>
          <MembersTable members={members ?? []} />
          {count > 0 && (
            <p className="text-sm text-muted-foreground">
              Mostrando {members?.length} de {count} miembros
            </p>
          )}
        </>
      )}
    </div>
  )
}
