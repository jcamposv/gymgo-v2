import { getClassTemplates } from '@/actions/template.actions'
import { TemplatesDataTable } from '@/components/templates'
import { ScheduleManager } from '@/components/schedule'

export const metadata = {
  title: 'Horario Semanal | GymGo',
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    page?: string
    pageSize?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
    filter_day_of_week?: string
    filter_class_type?: string
    filter_is_active?: 'active' | 'inactive'
  }>
}

export default async function TemplatesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page) : 1
  const pageSize = params.pageSize ? parseInt(params.pageSize) : 100 // Get all for calendar view

  // Convert is_active filter
  let isActive: boolean | undefined
  if (params.filter_is_active === 'active') isActive = true
  else if (params.filter_is_active === 'inactive') isActive = false

  const { data: templates, count, error } = await getClassTemplates({
    query: params.search,
    day_of_week: params.filter_day_of_week ? parseInt(params.filter_day_of_week) : undefined,
    class_type: params.filter_class_type,
    is_active: isActive,
    page,
    per_page: pageSize,
    sort_by: params.sortBy || 'day_of_week',
    sort_dir: params.sortDir || 'asc',
  })

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Horario Semanal</h1>
        <p className="text-muted-foreground">
          Configura tu semana tipo y genera clases automaticamente
        </p>
      </div>

      <ScheduleManager
        templates={templates || []}
        tableView={
          <TemplatesDataTable
            templates={templates || []}
            totalItems={count || 0}
          />
        }
      />
    </div>
  )
}
