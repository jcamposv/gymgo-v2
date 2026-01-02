import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { getCurrentOrganization } from '@/actions/onboarding.actions'
import { PlanForm } from '@/components/plans'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Nuevo Plan | GymGo',
}

export default async function NewPlanPage() {
  const { data: organization } = await getCurrentOrganization()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/plans">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo plan</h1>
          <p className="text-muted-foreground">
            Crea un nuevo plan de membresia
          </p>
        </div>
      </div>

      <PlanForm mode="create" currency={organization?.currency ?? 'MXN'} />
    </div>
  )
}
