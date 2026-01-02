import Link from 'next/link'
import { Plus, CalendarDays } from 'lucide-react'

import { getClasses } from '@/actions/class.actions'
import { ClassesTable } from '@/components/classes'
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
  title: 'Clases | GymGo',
}

const CLASS_TYPES = [
  { value: 'crossfit', label: 'CrossFit' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'pilates', label: 'Pilates' },
  { value: 'spinning', label: 'Spinning' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'strength', label: 'Fuerza' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'functional', label: 'Funcional' },
  { value: 'boxing', label: 'Box' },
  { value: 'mma', label: 'MMA' },
  { value: 'stretching', label: 'Estiramiento' },
  { value: 'open_gym', label: 'Open Gym' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Otro' },
]

interface PageProps {
  searchParams: Promise<{
    start_date?: string
    end_date?: string
    class_type?: string
    page?: string
  }>
}

export default async function ClassesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { data: classes, count, error } = await getClasses({
    start_date: params.start_date,
    end_date: params.end_date,
    class_type: params.class_type,
    page: params.page ? parseInt(params.page) : 1,
    per_page: 50,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clases</h1>
          <p className="text-muted-foreground">
            Gestiona las clases y horarios de tu gimnasio
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/classes/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva clase
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <Input
              name="start_date"
              type="date"
              className="w-auto"
              defaultValue={params.start_date}
            />
          </div>
          <span className="flex items-center text-muted-foreground">a</span>
          <Input
            name="end_date"
            type="date"
            className="w-auto"
            defaultValue={params.end_date}
          />
        </div>
        <Select name="class_type" defaultValue={params.class_type ?? 'all'}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo de clase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {CLASS_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : (
        <>
          <ClassesTable classes={classes ?? []} />
          {count > 0 && (
            <p className="text-sm text-muted-foreground">
              Mostrando {classes?.length} de {count} clases
            </p>
          )}
        </>
      )}
    </div>
  )
}
