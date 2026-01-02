import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { getRoutine, getRoutineTemplates, assignRoutineToMember } from '@/actions/routine.actions'
import { getMembers } from '@/actions/member.actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AssignRoutineForm } from './assign-form'

interface AssignRoutinePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: AssignRoutinePageProps) {
  const { id } = await params
  const { data: routine } = await getRoutine(id)
  return {
    title: routine ? `Asignar ${routine.name} | GymGo` : 'Asignar Rutina | GymGo',
  }
}

export default async function AssignRoutinePage({ params }: AssignRoutinePageProps) {
  const { id } = await params
  const { data: routine, error } = await getRoutine(id)

  if (error || !routine) {
    notFound()
  }

  // Only templates can be assigned
  if (!routine.is_template) {
    redirect(`/dashboard/routines/${id}`)
  }

  const { data: members } = await getMembers({ status: 'active', per_page: 100 })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/routines/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asignar Rutina</h1>
          <p className="text-muted-foreground">{routine.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar miembro</CardTitle>
          <CardDescription>
            Elige a quien asignar esta rutina
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AssignRoutineForm
            routineId={id}
            routineName={routine.name}
            members={members || []}
          />
        </CardContent>
      </Card>
    </div>
  )
}
