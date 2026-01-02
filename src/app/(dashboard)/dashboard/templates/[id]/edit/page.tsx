import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { getClassTemplate } from '@/actions/template.actions'
import { Button } from '@/components/ui/button'
import { TemplateForm } from '@/components/templates'

interface EditTemplatePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditTemplatePageProps) {
  const { id } = await params
  const { data: template } = await getClassTemplate(id)
  return {
    title: template ? `Editar ${template.name} | GymGo` : 'Editar Plantilla | GymGo',
  }
}

export default async function EditTemplatePage({ params }: EditTemplatePageProps) {
  const { id } = await params
  const { data: template, error } = await getClassTemplate(id)

  if (error || !template) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/templates/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Plantilla</h1>
          <p className="text-muted-foreground">{template.name}</p>
        </div>
      </div>

      <TemplateForm template={template} mode="edit" />
    </div>
  )
}
