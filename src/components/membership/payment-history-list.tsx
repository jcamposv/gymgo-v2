'use client'

import { CreditCard, Calendar, FileText } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  PAYMENT_PERIOD_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  formatCurrency,
  formatDate,
} from '@/schemas/membership.schema'
import type { MembershipPayment } from '@/actions/membership.actions'

interface PaymentHistoryListProps {
  payments: MembershipPayment[]
  currency?: string
}

export function PaymentHistoryList({ payments, currency = 'MXN' }: PaymentHistoryListProps) {
  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
          <p className="text-muted-foreground">No hay pagos registrados</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => {
        const periodOption = PAYMENT_PERIOD_OPTIONS.find(o => o.value === payment.period_type)
        const methodOption = PAYMENT_METHOD_OPTIONS.find(o => o.value === payment.payment_method)

        return (
          <Card key={payment.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-lime-100">
                    <CreditCard className="h-5 w-5 text-lime-700" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {formatCurrency(payment.amount, payment.currency || currency)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {periodOption?.label || payment.period_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(payment.period_start_date)} - {formatDate(payment.period_end_date)}
                    </p>
                    {payment.plan?.name && (
                      <p className="text-xs text-muted-foreground">
                        Plan: {payment.plan.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {methodOption?.label || payment.payment_method}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(payment.created_at)}
                  </p>
                </div>
              </div>

              {payment.notes && (
                <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">
                  {payment.notes}
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
