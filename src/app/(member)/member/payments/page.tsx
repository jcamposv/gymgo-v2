import { CreditCard } from 'lucide-react'

import { getMyMembershipStatus, getMyPaymentHistory } from '@/actions/membership.actions'
import { MembershipStatusCard, PaymentHistoryList, MembershipBanner } from '@/components/membership'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export const metadata = {
  title: 'Mi Membresia | GymGo',
}

export default async function MemberPaymentsPage() {
  const [statusResult, paymentsResult] = await Promise.all([
    getMyMembershipStatus(),
    getMyPaymentHistory(20),
  ])

  const membershipStatus = statusResult.data
  const payments = paymentsResult.data || []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-lime-600" />
          Mi Membresia
        </h1>
        <p className="text-muted-foreground">
          Estado de tu membresia e historial de pagos
        </p>
      </div>

      {/* Expiration Banner */}
      {membershipStatus && (
        <MembershipBanner status={membershipStatus} dismissible />
      )}

      {/* Membership Status */}
      {membershipStatus ? (
        <MembershipStatusCard status={membershipStatus} showPaymentLink={false} />
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No pudimos cargar el estado de tu membresia
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Historial de pagos</h2>
        <PaymentHistoryList payments={payments} />
      </div>
    </div>
  )
}
