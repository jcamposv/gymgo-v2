'use client'

import { DollarSign, Users, Calendar, Dumbbell, MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react'

import { cn, formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { DashboardKpi } from '@/types/dashboard.types'

const iconMap = {
  revenue: DollarSign,
  clients: Users,
  classes: Calendar,
  equipment: Dumbbell,
}

interface KpiCardProps {
  kpi: DashboardKpi
  className?: string
}

/**
 * Format the KPI value based on whether it has a currency
 */
function formatKpiValue(value: number, currency?: string): string {
  if (currency) {
    return formatCurrency(value, { currency, compact: true })
  }
  return value.toLocaleString()
}

export function KpiCard({ kpi, className }: KpiCardProps) {
  const Icon = iconMap[kpi.icon]
  const isPositive = kpi.deltaType === 'increase'

  return (
    <Card className={cn('relative', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {kpi.title}
          </CardTitle>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold">
            {formatKpiValue(kpi.value, kpi.currency)}
          </span>
          <div
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              isPositive
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {isPositive ? '+' : '-'}{Math.abs(kpi.delta)}%
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{kpi.subtitle}</p>
      </CardContent>
    </Card>
  )
}
