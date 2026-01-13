'use client'

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Receipt,
  AlertCircle,
} from 'lucide-react'

import { cn, formatCurrency } from '@/lib/utils'
import type { FinanceOverview } from '@/actions/finance.actions'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface FinanceOverviewProps {
  data: FinanceOverview
  loading?: boolean
}

interface KPICardProps {
  title: string
  value: string
  description?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: number
  variant?: 'default' | 'success' | 'warning' | 'danger'
  loading?: boolean
  comparisonValue?: string
}

function KPICard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  variant = 'default',
  loading,
  comparisonValue,
}: KPICardProps) {
  const variantStyles = {
    default: 'bg-card',
    success: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
    warning: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800',
    danger: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
  }

  const iconStyles = {
    default: 'text-muted-foreground',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
  }

  if (loading) {
    return (
      <Card className={variantStyles[variant]}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(variantStyles[variant], 'transition-opacity', loading && 'opacity-50')}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={iconStyles[variant]}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {trend && trendValue !== undefined && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                trend === 'up' && 'text-green-600',
                trend === 'down' && 'text-red-600',
                trend === 'neutral' && 'text-muted-foreground'
              )}
            >
              {trend === 'up' ? (
                <TrendingUp className="h-3 w-3" />
              ) : trend === 'down' ? (
                <TrendingDown className="h-3 w-3" />
              ) : null}
              {trendValue > 0 ? '+' : ''}{trendValue}%
            </span>
          )}
        </div>
        {comparisonValue && (
          <p className="text-xs text-muted-foreground mt-1">
            Anterior: {comparisonValue}
          </p>
        )}
        {description && !comparisonValue && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

export function FinanceOverviewCards({ data, loading }: FinanceOverviewProps) {
  const {
    totalIncome,
    totalExpenses,
    netProfit,
    membershipIncome,
    otherIncome,
    pendingPayments,
    currency,
    comparison,
  } = data

  const profitVariant = netProfit >= 0 ? 'success' : 'danger'
  const profitTrend = netProfit >= 0 ? 'up' : 'down'

  // Helper to determine trend direction
  const getTrend = (change: number | undefined): 'up' | 'down' | 'neutral' => {
    if (change === undefined || change === 0) return 'neutral'
    return change > 0 ? 'up' : 'down'
  }

  return (
    <div className="space-y-6">
      {/* Main KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Ingresos Totales"
          value={formatCurrency(totalIncome, { currency })}
          description={!comparison ? "Membresias + otros ingresos" : undefined}
          icon={<DollarSign className="h-4 w-4" />}
          trend={comparison ? getTrend(comparison.totalIncomeChange) : undefined}
          trendValue={comparison?.totalIncomeChange}
          comparisonValue={comparison ? formatCurrency(comparison.totalIncome, { currency }) : undefined}
          variant="default"
          loading={loading}
        />
        <KPICard
          title="Gastos Totales"
          value={formatCurrency(totalExpenses, { currency })}
          description={!comparison ? "Todos los gastos del periodo" : undefined}
          icon={<Receipt className="h-4 w-4" />}
          trend={comparison ? getTrend(comparison.totalExpensesChange) : undefined}
          trendValue={comparison?.totalExpensesChange}
          comparisonValue={comparison ? formatCurrency(comparison.totalExpenses, { currency }) : undefined}
          variant="default"
          loading={loading}
        />
        <KPICard
          title="Utilidad Neta"
          value={formatCurrency(netProfit, { currency })}
          description={!comparison ? "Ingresos - Gastos" : undefined}
          icon={netProfit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          trend={comparison ? getTrend(comparison.netProfitChange) : profitTrend}
          trendValue={comparison?.netProfitChange}
          comparisonValue={comparison ? formatCurrency(comparison.netProfit, { currency }) : undefined}
          variant={profitVariant}
          loading={loading}
        />
        <KPICard
          title="Pagos Pendientes"
          value={formatCurrency(pendingPayments, { currency })}
          description="Por cobrar"
          icon={<AlertCircle className="h-4 w-4" />}
          variant={pendingPayments > 0 ? 'warning' : 'default'}
          loading={loading}
        />
      </div>

      {/* Income breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Desglose de Ingresos</CardTitle>
            <CardDescription>Fuentes de ingreso del periodo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Membresias</span>
              </div>
              <span className="font-medium">
                {formatCurrency(membershipIncome, { currency })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Otros ingresos</span>
              </div>
              <span className="font-medium">
                {formatCurrency(otherIncome, { currency })}
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between font-medium">
                <span>Total</span>
                <span>{formatCurrency(totalIncome, { currency })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen del Periodo</CardTitle>
            <CardDescription>Balance financiero actual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-green-600">
              <span className="text-sm">+ Ingresos</span>
              <span className="font-medium">
                {formatCurrency(totalIncome, { currency })}
              </span>
            </div>
            <div className="flex items-center justify-between text-red-600">
              <span className="text-sm">- Gastos</span>
              <span className="font-medium">
                {formatCurrency(totalExpenses, { currency })}
              </span>
            </div>
            <div className="border-t pt-4">
              <div className={`flex items-center justify-between font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <span>= Utilidad</span>
                <span>{formatCurrency(netProfit, { currency })}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
