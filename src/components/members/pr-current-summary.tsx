'use client'

import { Trophy, TrendingUp, Dumbbell } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import type { CurrentPR } from '@/types/benchmark.types'
import { formatBenchmarkValue, BENCHMARK_UNIT_LABELS } from '@/types/benchmark.types'

// =============================================================================
// TYPES
// =============================================================================

interface PRCurrentSummaryProps {
  currentPRs: CurrentPR[]
  isLoading?: boolean
  onSelectExercise?: (exerciseId: string) => void
  selectedExerciseId?: string | null
}

// =============================================================================
// PR CARD COMPONENT
// =============================================================================

interface PRCardProps {
  pr: CurrentPR
  isSelected?: boolean
  onClick?: () => void
}

function PRCard({ pr, isSelected, onClick }: PRCardProps) {
  const formattedDate = format(parseISO(pr.achieved_at), "d MMM ''yy", { locale: es })

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex flex-col items-start gap-2 p-4 rounded-lg border text-left
        min-w-[180px] max-w-[220px] transition-all
        hover:border-primary/50 hover:bg-accent/50
        ${isSelected ? 'border-primary bg-accent ring-1 ring-primary' : 'border-border bg-card'}
      `}
    >
      <div className="flex items-center justify-between w-full">
        <Trophy className="h-4 w-4 text-yellow-500" />
        {pr.exercise_category && (
          <Badge variant="secondary" className="text-xs">
            {pr.exercise_category}
          </Badge>
        )}
      </div>
      <div className="space-y-1">
        <p className="font-medium text-sm line-clamp-1">{pr.exercise_name}</p>
        <p className="text-2xl font-bold text-primary">
          {formatBenchmarkValue(pr.value, pr.unit)}
        </p>
        {pr.reps && (
          <p className="text-xs text-muted-foreground">
            {pr.reps} reps
          </p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{formattedDate}</p>
    </button>
  )
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function PRCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg border min-w-[180px] max-w-[220px]">
      <div className="flex items-center justify-between w-full">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
      <Skeleton className="h-3 w-16" />
    </div>
  )
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function PREmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/30">
      <Dumbbell className="h-10 w-10 text-muted-foreground/50 mb-3" />
      <p className="text-sm font-medium text-muted-foreground">
        No hay PRs registrados
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Registra el primer PR de este miembro
      </p>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PRCurrentSummary({
  currentPRs,
  isLoading,
  onSelectExercise,
  selectedExerciseId,
}: PRCurrentSummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            PRs Actuales
          </CardTitle>
          <CardDescription>Cargando récords personales...</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 pb-4">
              {[1, 2, 3].map((i) => (
                <PRCardSkeleton key={i} />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  if (currentPRs.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            PRs Actuales
          </CardTitle>
          <CardDescription>Récords personales por ejercicio</CardDescription>
        </CardHeader>
        <CardContent>
          <PREmptyState />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              PRs Actuales
            </CardTitle>
            <CardDescription>
              {currentPRs.length} récord{currentPRs.length !== 1 ? 'es' : ''} personal{currentPRs.length !== 1 ? 'es' : ''}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            <Trophy className="h-3 w-3 mr-1 text-yellow-500" />
            {currentPRs.length} PRs
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-3 pb-4">
            {currentPRs.map((pr) => (
              <PRCard
                key={pr.benchmark_id}
                pr={pr}
                isSelected={selectedExerciseId === pr.exercise_id}
                onClick={() => onSelectExercise?.(pr.exercise_id)}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        {selectedExerciseId && (
          <p className="text-xs text-muted-foreground mt-2">
            Click en un PR para ver su historial y progreso
          </p>
        )}
      </CardContent>
    </Card>
  )
}
