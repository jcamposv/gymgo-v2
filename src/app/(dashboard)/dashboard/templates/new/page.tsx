import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { TemplateForm } from '@/components/templates'

export const metadata = {
  title: 'Nueva Plantilla | GymGo',
}

export default function NewTemplatePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/templates">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nueva Plantilla</h1>
          <p className="text-muted-foreground">
            Crear un nuevo horario semanal recurrente
          </p>
        </div>
      </div>

      <TemplateForm mode="create" />
    </div>
  )
}
