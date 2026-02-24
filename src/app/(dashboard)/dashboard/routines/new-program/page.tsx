import Link from 'next/link'
import { ArrowLeft, Calendar } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ProgramForm } from '@/components/routines/program-form'

export const metadata = {
  title: 'Nuevo Programa | GymGo',
}

export default function NewProgramPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/routines">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 text-lime-600" />
            Nuevo Programa
          </h1>
          <p className="text-muted-foreground">
            Crea un programa de entrenamiento con multiples dias
          </p>
        </div>
      </div>

      <ProgramForm />
    </div>
  )
}
