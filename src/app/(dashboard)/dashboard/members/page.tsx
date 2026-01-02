import { getMembers } from '@/actions/member.actions'
import { MembersDataTable } from '@/components/members'

export const metadata = {
  title: 'Miembros | GymGo',
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    page?: string
    pageSize?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
    filter_status?: 'active' | 'inactive' | 'suspended' | 'cancelled'
    filter_experience_level?: 'beginner' | 'intermediate' | 'advanced'
  }>
}

export default async function MembersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page) : 1
  const pageSize = params.pageSize ? parseInt(params.pageSize) : 20

  const { data: members, count, error } = await getMembers({
    query: params.search,
    status: params.filter_status,
    experience_level: params.filter_experience_level,
    page,
    per_page: pageSize,
    sort_by: params.sortBy,
    sort_dir: params.sortDir,
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
        <h1 className="text-2xl font-bold tracking-tight">Miembros</h1>
        <p className="text-muted-foreground">
          Gestiona los miembros de tu gimnasio
        </p>
      </div>

      <MembersDataTable
        members={members || []}
        totalItems={count || 0}
      />
    </div>
  )
}
