import Link from 'next/link'
import { Plus } from 'lucide-react'

import { getClassTemplates } from '@/actions/template.actions'
import { Button } from '@/components/ui/button'
import { TemplatesTable, GenerateClassesDialog } from '@/components/templates'

export const metadata = {
  title: 'Plantillas de Clases | GymGo',
}

export default async function TemplatesPage() {
  const { data: templates, error } = await getClassTemplates()

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plantillas de Clases</h1>
          <p className="text-muted-foreground">
            Horarios semanales para generacion automatica
          </p>
        </div>
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          Error al cargar las plantillas: {error}
        </div>
      </div>
    )
  }

  const activeTemplates = templates?.filter((t) => t.is_active) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plantillas de Clases</h1>
          <p className="text-muted-foreground">
            Horarios semanales para generacion automatica
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GenerateClassesDialog disabled={activeTemplates.length === 0} />
          <Button asChild>
            <Link href="/dashboard/templates/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva plantilla
            </Link>
          </Button>
        </div>
      </div>

      <TemplatesTable templates={templates ?? []} />
    </div>
  )
}
