import Link from 'next/link'
import { Plus, Dumbbell, Search, Filter } from 'lucide-react'

import { getRoutines } from '@/actions/routine.actions'
import { workoutTypeLabels } from '@/schemas/routine.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RoutinesTable } from '@/components/routines'

export const metadata = {
  title: 'Rutinas | GymGo',
}

interface RoutinesPageProps {
  searchParams: Promise<{
    query?: string
    type?: string
    template?: string
    page?: string
  }>
}

export default async function RoutinesPage({ searchParams }: RoutinesPageProps) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page) : 1
  const isTemplate = params.template === 'true' ? true : params.template === 'false' ? false : undefined

  const { data: routines, count, error } = await getRoutines({
    query: params.query,
    workout_type: params.type as 'routine' | 'wod' | 'program' | undefined,
    is_template: isTemplate,
    page,
    per_page: 20,
  })

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rutinas</h1>
          <p className="text-muted-foreground">
            {count} rutina{count !== 1 ? 's' : ''} en total
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/routines/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva rutina
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <form className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="query"
              placeholder="Buscar rutinas..."
              defaultValue={params.query}
              className="pl-9"
            />
          </div>
        </form>

        <Tabs defaultValue={params.template ?? 'all'} className="w-auto">
          <TabsList>
            <TabsTrigger value="all" asChild>
              <Link href="/dashboard/routines">Todas</Link>
            </TabsTrigger>
            <TabsTrigger value="true" asChild>
              <Link href="/dashboard/routines?template=true">Plantillas</Link>
            </TabsTrigger>
            <TabsTrigger value="false" asChild>
              <Link href="/dashboard/routines?template=false">Asignadas</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {routines && routines.length > 0 ? (
        <RoutinesTable routines={routines} />
      ) : (
        <div className="border rounded-lg p-12 text-center">
          <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-1">No hay rutinas</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Crea tu primera rutina para comenzar a asignarlas a tus miembros
          </p>
          <Button asChild>
            <Link href="/dashboard/routines/new">
              <Plus className="mr-2 h-4 w-4" />
              Crear rutina
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
