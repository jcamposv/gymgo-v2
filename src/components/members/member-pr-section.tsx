'use client'

import { useState, useMemo } from 'react'
import { Plus, Trophy, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { PRCurrentSummary } from './pr-current-summary'
import { PRHistoryTable } from './pr-history-table'
import { PRProgressChart } from './pr-progress-chart'
import { BenchmarkFormDialog } from './benchmark-form-dialog'

import {
  useMemberBenchmarks,
  useBenchmarkChartData,
  useExerciseOptions,
} from '@/hooks/use-member-benchmarks'
import type { BenchmarkFormData, BenchmarkUnit } from '@/types/benchmark.types'

// =============================================================================
// TYPES
// =============================================================================

interface MemberPRSectionProps {
  memberId: string
  memberName: string
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MemberPRSection({ memberId, memberName }: MemberPRSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  // Hooks
  const {
    benchmarks,
    currentPRs,
    totalBenchmarks,
    page,
    pageSize,
    isLoading,
    isSubmitting,
    error,
    selectedExerciseId,
    dateFrom,
    dateTo,
    addBenchmark,
    setExerciseFilter,
    setDateRange,
  } = useMemberBenchmarks(memberId)

  const { exercises } = useExerciseOptions()

  // Get selected exercise info
  const selectedExercise = useMemo(() => {
    if (!selectedExerciseId) return null
    const pr = currentPRs.find((p) => p.exercise_id === selectedExerciseId)
    const exercise = exercises.find((e) => e.id === selectedExerciseId)
    return {
      id: selectedExerciseId,
      name: pr?.exercise_name || exercise?.name || 'Ejercicio',
      unit: pr?.unit || ('kg' as BenchmarkUnit),
    }
  }, [selectedExerciseId, currentPRs, exercises])

  // Chart data for selected exercise
  const { chartData, isLoading: chartLoading } = useBenchmarkChartData(
    memberId,
    selectedExerciseId,
    dateFrom,
    dateTo
  )

  // Handle add benchmark
  const handleAddBenchmark = async (data: BenchmarkFormData) => {
    const result = await addBenchmark(data)

    if (result.success) {
      toast.success('PR registrado exitosamente')
      setDialogOpen(false)
    } else {
      toast.error(result.error || 'Error al registrar el PR')
    }

    return result
  }

  // Handle exercise selection from PR cards
  const handleSelectExercise = (exerciseId: string) => {
    // Toggle selection
    if (selectedExerciseId === exerciseId) {
      setExerciseFilter(null)
    } else {
      setExerciseFilter(exerciseId)
    }
  }

  // Clear filters
  const handleClearFilters = () => {
    setExerciseFilter(null)
    setDateRange(null, null)
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">PRs / Benchmarks</CardTitle>
                <CardDescription>
                  Récords personales de {memberName}
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Registrar PR
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8 border rounded-lg bg-muted/30">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Cargando PRs...</span>
        </div>
      ) : (
        <>
          {/* Current PRs Summary */}
          <PRCurrentSummary
            currentPRs={currentPRs}
            isLoading={isLoading}
            onSelectExercise={handleSelectExercise}
            selectedExerciseId={selectedExerciseId}
          />

          {/* Progress Chart (shown when exercise is selected) */}
          <PRProgressChart
            data={chartData}
            exerciseName={selectedExercise?.name || ''}
            unit={selectedExercise?.unit || 'kg'}
            isLoading={chartLoading}
          />

          {/* History Table with Tabs */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Historial de PRs</CardTitle>
                  <CardDescription>
                    {selectedExerciseId
                      ? `Mostrando ${benchmarks.length} de ${totalBenchmarks} registros para ${selectedExercise?.name}`
                      : `Mostrando ${benchmarks.length} de ${totalBenchmarks} registros`}
                  </CardDescription>
                </div>
                {selectedExerciseId && (
                  <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                    Ver todos
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <PRHistoryTable
                benchmarks={benchmarks}
                totalItems={totalBenchmarks}
                isLoading={isLoading}
                exercises={exercises}
                selectedExerciseId={selectedExerciseId}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Benchmark Form Dialog */}
      <BenchmarkFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        memberId={memberId}
        onSubmit={handleAddBenchmark}
      />
    </div>
  )
}
