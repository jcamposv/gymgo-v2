import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

import { getClass } from '@/actions/class.actions'
import { ClassForm } from '@/components/classes'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Editar Clase | GymGo',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditClassPage({ params }: PageProps) {
  const { id } = await params
  const { data: classData, error } = await getClass(id)

  if (error || !classData) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/classes/${id}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Clase</h1>
          <p className="text-muted-foreground">
            {classData.name}
          </p>
        </div>
      </div>

      <ClassForm mode="edit" classData={classData} />
    </div>
  )
}
