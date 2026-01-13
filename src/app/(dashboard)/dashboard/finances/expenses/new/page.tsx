import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { getCurrentOrganization } from '@/actions/onboarding.actions'
import { ExpenseForm } from '@/components/finances'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Nuevo Gasto | GymGo',
}

export default async function NewExpensePage() {
  const { data: organization } = await getCurrentOrganization()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/finances/expenses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registrar gasto</h1>
          <p className="text-muted-foreground">
            Registra un nuevo gasto del gimnasio
          </p>
        </div>
      </div>

      <ExpenseForm currency={organization?.currency ?? 'MXN'} />
    </div>
  )
}
