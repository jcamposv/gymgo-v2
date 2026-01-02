import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ExerciseForm } from '@/components/exercises'

export const metadata = {
  title: 'Nuevo Ejercicio | GymGo',
}

export default function NewExercisePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/exercises">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Ejercicio</h1>
          <p className="text-muted-foreground">
            Agrega un ejercicio a tu biblioteca
          </p>
        </div>
      </div>

      <ExerciseForm mode="create" />
    </div>
  )
}
