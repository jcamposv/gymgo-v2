'use client'

import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

import type { Tables } from '@/types/database.types'
import { classTypes, daysOfWeek } from '@/schemas/template.schema'
import { DataTable, type FilterConfig } from '@/components/data-table'
import { templateColumns } from './templates-columns'
import { GenerateClassesDialog } from './generate-dialog'

interface TemplatesDataTableProps {
  templates: Tables<'class_templates'>[]
  totalItems: number
}

// Define filters for templates
const templateFilters: FilterConfig[] = [
  {
    id: 'day_of_week',
    label: 'Dia',
    type: 'select',
    options: daysOfWeek.map((d) => ({ label: d.label, value: String(d.value) })),
  },
  {
    id: 'class_type',
    label: 'Tipo',
    type: 'select',
    options: classTypes.map((t) => ({ label: t.label, value: t.value })),
  },
  {
    id: 'is_active',
    label: 'Estado',
    type: 'select',
    options: [
      { label: 'Activa', value: 'active' },
      { label: 'Inactiva', value: 'inactive' },
    ],
  },
]

export function TemplatesDataTable({ templates, totalItems }: TemplatesDataTableProps) {
  const router = useRouter()
  const activeTemplates = templates.filter((t) => t.is_active)

  // Custom toolbar with Generate button
  const customToolbar = (
    <div className="flex items-center gap-2">
      <GenerateClassesDialog disabled={activeTemplates.length === 0} />
    </div>
  )

  return (
    <DataTable
      columns={templateColumns}
      data={templates}
      mode="server"
      totalItems={totalItems}
      defaultPageSize={20}
      searchable
      searchPlaceholder="Buscar plantillas..."
      filters={templateFilters}
      primaryAction={{
        id: 'new',
        label: 'Nueva plantilla',
        icon: Plus,
        onClick: () => router.push('/dashboard/templates/new'),
      }}
      secondaryActions={[
        {
          id: 'generate',
          label: 'Generar clases',
          onClick: () => {}, // Handled by GenerateClassesDialog
          disabled: activeTemplates.length === 0,
        },
      ]}
      emptyTitle="No hay plantillas creadas"
      emptyDescription="Crea tu primera plantilla para comenzar a generar clases automaticamente"
    />
  )
}
