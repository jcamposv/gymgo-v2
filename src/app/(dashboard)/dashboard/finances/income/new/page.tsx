import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { getCurrentOrganization } from '@/actions/onboarding.actions'
import { IncomeForm } from '@/components/finances/income-form'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Nuevo Ingreso | GymGo',
}

export default async function NewIncomePage() {
  const { data: organization } = await getCurrentOrganization()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/finances/income">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registrar ingreso</h1>
          <p className="text-muted-foreground">
            Registra un nuevo ingreso adicional
          </p>
        </div>
      </div>

      <IncomeForm currency={organization?.currency ?? 'MXN'} />
    </div>
  )
}
