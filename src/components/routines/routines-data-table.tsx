'use client'

import { useRouter } from 'next/navigation'
import { Plus, Sparkles, Calendar, ChevronDown } from 'lucide-react'

import type { WorkoutWithMember } from '@/actions/routine.actions'
import { workoutTypes } from '@/schemas/routine.schema'
import { DataTable, type FilterConfig } from '@/components/data-table'
import { routineColumns } from './routines-columns'
import { AIRoutineGenerator } from '@/components/ai'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface RoutinesDataTableProps {
  routines: WorkoutWithMember[]
  totalItems: number
}

// Define filters for routines
const routineFilters: FilterConfig[] = [
  {
    id: 'workout_type',
    label: 'Tipo',
    type: 'select',
    options: workoutTypes.map((t) => ({ label: t.label, value: t.value })),
  },
  {
    id: 'is_template',
    label: 'Categoria',
    type: 'select',
    options: [
      { label: 'Plantillas', value: 'true' },
      { label: 'Asignadas', value: 'false' },
    ],
  },
  {
    id: 'is_active',
    label: 'Estado',
    type: 'select',
    options: [
      { label: 'Activa', value: 'true' },
      { label: 'Inactiva', value: 'false' },
    ],
  },
]

export function RoutinesDataTable({ routines, totalItems }: RoutinesDataTableProps) {
  const router = useRouter()

  return (
    <div className="space-y-4">
      {/* Action Buttons Row */}
      <div className="flex items-center justify-end gap-2">
        <AIRoutineGenerator
          trigger={
            <Button variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generar con AI
            </Button>
          }
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Crear nuevo
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push('/dashboard/routines/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Rutina simple
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/routines/new-program')}>
              <Calendar className="h-4 w-4 mr-2" />
              Programa multi-dia
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DataTable
        columns={routineColumns}
        data={routines}
        mode="server"
        totalItems={totalItems}
        defaultPageSize={20}
        searchable
        searchPlaceholder="Buscar rutinas..."
        filters={routineFilters}
        emptyTitle="No hay rutinas"
        emptyDescription="Crea tu primera rutina para comenzar a asignarlas a tus miembros"
      />
    </div>
  )
}
