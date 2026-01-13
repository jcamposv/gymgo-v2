'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import type { RevenuePoint, RevenuePeriod } from '@/types/dashboard.types'

const chartConfig = {
  income: {
    label: 'Ingresos',
    color: '#1a1a2e',
  },
  expense: {
    label: 'Gastos',
    color: '#b8e986',
  },
} satisfies ChartConfig

interface RevenueChartProps {
  data: RevenuePoint[]
  className?: string
  period?: RevenuePeriod
  onPeriodChange?: (period: RevenuePeriod) => void
}

export function RevenueChart({
  data,
  className,
  period = 'week',
  onPeriodChange,
}: RevenueChartProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Ingresos</CardTitle>
        <Tabs value={period} onValueChange={(v) => onPeriodChange?.(v as RevenuePeriod)}>
          <TabsList className="h-9">
            <TabsTrigger value="week" className="text-xs px-3">Semana</TabsTrigger>
            <TabsTrigger value="month" className="text-xs px-3">Mes</TabsTrigger>
            <TabsTrigger value="year" className="text-xs px-3">Año</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.1} />
                <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
              tickFormatter={(value) => `${(value / 1000).toFixed(1)}K`}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <ChartLegend content={<ChartLegendContent />} verticalAlign="top" />
            <Area
              dataKey="expense"
              type="monotone"
              fill="url(#fillExpense)"
              stroke="var(--color-expense)"
              strokeWidth={2}
            />
            <Area
              dataKey="income"
              type="monotone"
              fill="url(#fillIncome)"
              stroke="var(--color-income)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
