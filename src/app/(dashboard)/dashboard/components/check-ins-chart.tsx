'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

const chartConfig = {
  checkIns: {
    label: 'Check-ins',
    color: '#b8e986',
  },
} satisfies ChartConfig

interface CheckInsChartProps {
  data: Array<{ date: string; checkIns: number }>
  className?: string
}

export function CheckInsChart({ data, className }: CheckInsChartProps) {
  const total = data.reduce((sum, item) => sum + item.checkIns, 0)

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Check-ins por Dia</CardTitle>
        <CardDescription>
          {total} check-ins en los ultimos {data.length} dias
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            No hay datos de check-ins
          </div>
        ) : (
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
              <Bar
                dataKey="checkIns"
                fill="var(--color-checkIns)"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
