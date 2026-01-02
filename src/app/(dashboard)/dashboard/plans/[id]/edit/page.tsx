import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { getPlan } from '@/actions/plan.actions'
import { PlanForm } from '@/components/plans'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Editar Plan | GymGo',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditPlanPage({ params }: PageProps) {
  const { id } = await params
  const { data: plan, error } = await getPlan(id)

  if (error || !plan) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/plans/${plan.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar plan</h1>
          <p className="text-muted-foreground">
            Modifica los datos del plan {plan.name}
          </p>
        </div>
      </div>

      <PlanForm plan={plan} mode="edit" />
    </div>
  )
}
