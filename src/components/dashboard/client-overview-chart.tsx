'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { MoreHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import type { ClientOverviewPoint } from '@/types/dashboard.types'

const chartConfig = {
  child: {
    label: 'Child',
    color: '#1a1a2e',
  },
  adult: {
    label: 'Adult',
    color: '#b8e986',
  },
  elderly: {
    label: 'Elderly',
    color: '#c4c4c4',
  },
} satisfies ChartConfig

interface ClientOverviewChartProps {
  data: ClientOverviewPoint[]
  className?: string
  period?: string
  onPeriodChange?: (period: string) => void
}

export function ClientOverviewChart({
  data,
  className,
  period = 'last8days',
  onPeriodChange,
}: ClientOverviewChartProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold">Client Overview</CardTitle>
          <p className="text-sm text-muted-foreground">by Age Stages</p>
        </div>
        <Select value={period} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[140px] h-9 bg-primary text-primary-foreground border-0">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last8days">Last 8 Days</SelectItem>
            <SelectItem value="last30days">Last 30 Days</SelectItem>
            <SelectItem value="last90days">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={data} barGap={2}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
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
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <ChartLegend content={<ChartLegendContent />} verticalAlign="top" />
            <Bar
              dataKey="child"
              fill="var(--color-child)"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
            />
            <Bar
              dataKey="adult"
              fill="var(--color-adult)"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
            />
            <Bar
              dataKey="elderly"
              fill="var(--color-elderly)"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
