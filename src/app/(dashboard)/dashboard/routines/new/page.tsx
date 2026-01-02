import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { RoutineForm } from '@/components/routines'

export const metadata = {
  title: 'Nueva Rutina | GymGo',
}

export default function NewRoutinePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/routines">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nueva Rutina</h1>
          <p className="text-muted-foreground">
            Crea una rutina de entrenamiento
          </p>
        </div>
      </div>

      <RoutineForm mode="create" />
    </div>
  )
}
