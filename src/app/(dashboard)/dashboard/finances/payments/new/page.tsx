import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { getCurrentOrganization } from '@/actions/onboarding.actions'
import { getActivePlans } from '@/actions/plan.actions'
import { getMembers } from '@/actions/member.actions'
import { PaymentForm } from '@/components/finances'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Nuevo Pago | GymGo',
}

export default async function NewPaymentPage() {
  const [orgResult, plansResult, membersResult] = await Promise.all([
    getCurrentOrganization(),
    getActivePlans(),
    getMembers({ per_page: 1000 }), // Get all members for selector
  ])

  const currency = orgResult.data?.currency ?? 'MXN'
  const plans = plansResult.data ?? []
  const members = (membersResult.data ?? []).map(m => ({
    id: m.id,
    full_name: m.full_name,
    email: m.email,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/finances/payments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registrar pago</h1>
          <p className="text-muted-foreground">
            Registra un nuevo pago de membresia
          </p>
        </div>
      </div>

      <PaymentForm
        members={members}
        plans={plans}
        currency={currency}
      />
    </div>
  )
}
