'use client'

import { Pie, PieChart, Cell, Label } from 'recharts'
import { MoreHorizontal, ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { ActivityOverview } from '@/types/dashboard.types'

interface ActivityDonutChartProps {
  data: ActivityOverview
  className?: string
}

export function ActivityDonutChart({ data, className }: ActivityDonutChartProps) {
  const chartConfig = data.breakdown.reduce((acc, item, index) => {
    acc[item.name.toLowerCase().replace(/\s+/g, '')] = {
      label: item.name,
      color: item.color,
    }
    return acc
  }, {} as ChartConfig)

  const chartData = data.breakdown.map((item) => ({
    name: item.name,
    value: item.value,
    fill: item.color,
  }))

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold">Client Overview</CardTitle>
          <p className="text-sm text-muted-foreground">by Activity type</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={80}
              strokeWidth={2}
              stroke="#fff"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 10}
                          className="fill-muted-foreground text-xs"
                        >
                          Overall
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 10}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {data.total.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 30}
                          className="fill-muted-foreground text-xs"
                        >
                          <tspan>{data.period}</tspan>
                          <tspan className="ml-1">
                            <ChevronDown className="inline h-3 w-3" />
                          </tspan>
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        {/* Legend */}
        <div className="w-full space-y-2">
          {data.breakdown.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-sm font-medium">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
