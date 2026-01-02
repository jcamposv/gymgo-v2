'use client'

import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { measurementHistoryLabels } from '@/lib/i18n'
import type { MeasurementWithBMI } from '@/types/member.types'

// =============================================================================
// TYPES
// =============================================================================

export type MetricType = 'weight' | 'bodyFat' | 'muscleMass' | 'bmi'

interface MeasurementHistoryChartProps {
  measurements: MeasurementWithBMI[]
  metric: MetricType
}

interface ChartDataPoint {
  date: string
  formattedDate: string
  value: number | null
}

// =============================================================================
// CHART CONFIGURATION
// =============================================================================

const metricConfig: Record<MetricType, {
  label: string
  color: string
  dataKey: keyof MeasurementWithBMI
  unit: string
}> = {
  weight: {
    label: measurementHistoryLabels.weight,
    color: '#84cc16', // lime-500
    dataKey: 'body_weight_kg',
    unit: 'kg',
  },
  bodyFat: {
    label: measurementHistoryLabels.bodyFat,
    color: '#f97316', // orange-500
    dataKey: 'body_fat_percentage',
    unit: '%',
  },
  muscleMass: {
    label: measurementHistoryLabels.muscleMass,
    color: '#3b82f6', // blue-500
    dataKey: 'muscle_mass_kg',
    unit: 'kg',
  },
  bmi: {
    label: measurementHistoryLabels.bmi,
    color: '#8b5cf6', // violet-500
    dataKey: 'bmi',
    unit: '',
  },
}

// =============================================================================
// COMPONENT
// =============================================================================

export function MeasurementHistoryChart({
  measurements,
  metric
}: MeasurementHistoryChartProps) {
  const config = metricConfig[metric]
  const labels = measurementHistoryLabels

  // Transform measurements to chart data (oldest to newest for progression)
  const chartData = useMemo<ChartDataPoint[]>(() => {
    // Sort by date ascending (oldest first) for progression chart
    const sorted = [...measurements].sort(
      (a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
    )

    return sorted.map((m) => {
      const date = parseISO(m.measured_at)
      const value = m[config.dataKey] as number | null | undefined
      return {
        date: m.measured_at,
        formattedDate: format(date, 'd MMM', { locale: es }),
        value: value ?? null,
      }
    })
  }, [measurements, config.dataKey])

  // Filter out null values for the chart
  const validData = chartData.filter((d) => d.value !== null)

  const chartConfig: ChartConfig = {
    value: {
      label: config.label,
      color: config.color,
    },
  }

  if (validData.length < 2) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
        {labels.noDataForChart}
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <AreaChart data={validData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={config.color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="formattedDate"
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
          width={40}
          tickFormatter={(value) => `${value}${config.unit}`}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                if (payload && payload[0]) {
                  const date = parseISO(payload[0].payload.date)
                  return format(date, "d 'de' MMMM yyyy", { locale: es })
                }
                return ''
              }}
              formatter={(value) => [
                `${value}${config.unit ? ` ${config.unit}` : ''}`,
                config.label,
              ]}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={config.color}
          strokeWidth={2}
          fill={`url(#gradient-${metric})`}
        />
      </AreaChart>
    </ChartContainer>
  )
}
