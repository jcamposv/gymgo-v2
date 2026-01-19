'use client'

import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceDot } from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { TrendingUp, Loader2 } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import type { BenchmarkChartPoint, BenchmarkUnit } from '@/types/benchmark.types'
import { BENCHMARK_UNIT_LABELS, isTimeBased } from '@/types/benchmark.types'

// =============================================================================
// TYPES
// =============================================================================

interface PRProgressChartProps {
  data: BenchmarkChartPoint[]
  exerciseName: string
  unit: BenchmarkUnit
  isLoading?: boolean
}

interface ChartDataPoint {
  date: string
  formattedDate: string
  value: number
  is_pr: boolean
}

// =============================================================================
// CHART CONFIGURATION
// =============================================================================

const chartConfig: ChartConfig = {
  value: {
    label: 'Valor',
    color: '#3b82f6', // blue-500
  },
}

// =============================================================================
// LOADING STATE
// =============================================================================

function ChartLoadingState() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function ChartEmptyState({ exerciseName }: { exerciseName?: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Progreso
        </CardTitle>
        <CardDescription>
          {exerciseName ? `Historial de ${exerciseName}` : 'Selecciona un ejercicio para ver el progreso'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
          {exerciseName
            ? 'No hay suficientes datos para mostrar el gráfico (mínimo 2 registros)'
            : 'Selecciona un ejercicio de la lista de PRs para ver su progreso'}
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PRProgressChart({
  data,
  exerciseName,
  unit,
  isLoading,
}: PRProgressChartProps) {
  const unitLabel = BENCHMARK_UNIT_LABELS[unit] || unit
  const isTimeBasedUnit = isTimeBased(unit)

  // Transform data for chart (oldest to newest for progression)
  const chartData = useMemo<ChartDataPoint[]>(() => {
    // Sort by date ascending (oldest first) for progression chart
    const sorted = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    return sorted.map((d) => {
      const date = parseISO(d.date)
      return {
        date: d.date,
        formattedDate: format(date, 'd MMM', { locale: es }),
        value: d.value,
        is_pr: d.is_pr,
      }
    })
  }, [data])

  // Find PR points for highlighting
  const prPoints = useMemo(() => {
    return chartData.filter((d) => d.is_pr)
  }, [chartData])

  if (isLoading) {
    return <ChartLoadingState />
  }

  if (!exerciseName || chartData.length < 2) {
    return <ChartEmptyState exerciseName={exerciseName} />
  }

  // Calculate improvement
  const firstValue = chartData[0]?.value ?? 0
  const lastValue = chartData[chartData.length - 1]?.value ?? 0
  const improvement = isTimeBasedUnit
    ? firstValue - lastValue // For time, lower is better
    : lastValue - firstValue // For weight/reps, higher is better
  const improvementPercent = firstValue > 0 ? Math.abs((improvement / firstValue) * 100).toFixed(1) : 0
  const isImproved = isTimeBasedUnit ? improvement > 0 : improvement > 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progreso: {exerciseName}
            </CardTitle>
            <CardDescription>
              {chartData.length} registros
              {isImproved && (
                <span className="ml-2 text-green-600">
                  +{improvementPercent}% mejora
                </span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradient-progress" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
              width={50}
              tickFormatter={(value) => `${value}${unitLabel ? ` ${unitLabel}` : ''}`}
              domain={isTimeBasedUnit ? ['auto', 'auto'] : [0, 'auto']}
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
                    `${value} ${unitLabel}`,
                    exerciseName,
                  ]}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#gradient-progress)"
            />
            {/* Highlight PR points */}
            {prPoints.map((pr, index) => (
              <ReferenceDot
                key={`pr-${index}`}
                x={pr.formattedDate}
                y={pr.value}
                r={6}
                fill="#eab308"
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ChartContainer>
        {prPoints.length > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Puntos amarillos = Récords personales</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
