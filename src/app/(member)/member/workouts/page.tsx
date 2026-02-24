import Link from 'next/link'
import { Dumbbell, Calendar, ChevronRight, Clock, AlertCircle, History, Target } from 'lucide-react'

import { getMyRoutines, getMyRoutineHistory } from '@/actions/routine.actions'
import { getTodaysWorkout, getMyActiveProgram } from '@/actions/program.actions'
import { workoutTypeLabels, wodTypeLabels, type ExerciseItem } from '@/schemas/routine.schema'
import type { Tables } from '@/types/database.types'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MemberWorkoutsHistoryTable } from '@/components/member/member-workouts-history-table'
import { TodaysWorkoutCard, CompactWorkoutCard } from '@/components/member/todays-workout-card'
import { ProgramProgressCard } from '@/components/member/program-progress-card'

export default async function MemberWorkoutsPage() {
  // Fetch today's workout (handles both programs and legacy routines)
  const todaysWorkoutResult = await getTodaysWorkout()
  const activeProgramResult = await getMyActiveProgram()

  // Also fetch active routines and history for tabs
  const [activeResult, historyResult] = await Promise.all([
    getMyRoutines(),
    getMyRoutineHistory(),
  ])

  const { data: todaysData, error: todaysError } = todaysWorkoutResult
  const { data: programData } = activeProgramResult
  const { data: activeRoutines, memberId, error: activeError } = activeResult
  const { data: historyRoutines, error: historyError } = historyResult

  // Separate legacy routines (non-program) from program days
  // NOTE: program_id and days_per_week are new columns from migration 027_training_programs.sql
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const legacyRoutines = (activeRoutines || []).filter((r: any) =>
    !r.program_id && !r.days_per_week
  )
  const legacyCount = legacyRoutines.length
  const historyCount = historyRoutines?.length || 0

  // Check if we have an active program
  const hasProgram = todaysData?.hasActiveProgram || !!programData

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mis Rutinas</h1>
        <p className="text-muted-foreground">
          Tu programa de entrenamiento personalizado
        </p>
      </div>

      {/* Error State */}
      {(activeError || todaysError) && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <p className="text-destructive font-medium">
              {activeError || todaysError}
            </p>
          </CardContent>
        </Card>
      )}

      {/* No Member Profile State */}
      {!activeError && !memberId && (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
            <p className="text-muted-foreground font-medium">
              No hemos encontrado un perfil de miembro asociado a tu cuenta
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Contacta a tu gimnasio para que te asocien como miembro
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {!activeError && memberId && (
        <div className="space-y-6">
          {/* Program Dashboard (if has active program) */}
          {hasProgram && programData && todaysData && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Program Progress */}
              <ProgramProgressCard
                programName={programData.program.name}
                progress={programData.progress}
                weeklyProgress={todaysData.progress || undefined}
              />

              {/* Today's Workout */}
              <TodaysWorkoutCard
                workout={todaysData.workout}
                progress={todaysData.progress}
                programName={todaysData.program?.name}
                nextDayNumber={todaysData.nextDayNumber}
                hasActiveProgram={todaysData.hasActiveProgram}
              />
            </div>
          )}

          {/* Program Days List */}
          {hasProgram && programData && programData.days.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  Dias del programa
                </CardTitle>
                <CardDescription>
                  {programData.days.length} dias de entrenamiento por semana
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {programData.days.map((day) => {
                    // Find the actual workout record for this day
                    // Get completions count to determine if today
                    const daysThisWeek = todaysData?.progress?.daysCompletedThisWeek || 0
                    const isToday = day.dayNumber === daysThisWeek + 1
                    const isCompleted = day.dayNumber <= daysThisWeek

                    return (
                      <Link key={day.id} href={`/member/workouts/${day.id}`}>
                        <Card
                          className={`hover:border-lime-300 transition-colors cursor-pointer h-full ${
                            isToday ? 'border-lime-400 bg-lime-50/50' : ''
                          } ${isCompleted ? 'opacity-60' : ''}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold shrink-0 ${
                                  isCompleted
                                    ? 'bg-lime-100 text-lime-700'
                                    : isToday
                                    ? 'bg-lime-600 text-white'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {day.dayNumber}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">
                                  {day.name}
                                </h4>
                                {day.description && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {day.description}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {day.exerciseCount} ejercicios
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {isToday && (
                                  <Badge variant="secondary" className="bg-lime-100 text-lime-700 text-xs">
                                    Hoy
                                  </Badge>
                                )}
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legacy Routines & History Tabs */}
          {(legacyCount > 0 || historyCount > 0 || !hasProgram) && (
            <Tabs defaultValue={hasProgram ? 'legacy' : 'active'} className="space-y-4">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value={hasProgram ? 'legacy' : 'active'} className="gap-2">
                  <Dumbbell className="h-4 w-4" />
                  {hasProgram ? 'Otras rutinas' : 'Rutinas actuales'}
                  {legacyCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {legacyCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <History className="h-4 w-4" />
                  Historial
                  {historyCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {historyCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Active/Legacy Routines Tab */}
              <TabsContent value={hasProgram ? 'legacy' : 'active'} className="space-y-4">
                {legacyRoutines.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
                      <p className="text-muted-foreground">
                        {hasProgram
                          ? 'No tienes otras rutinas asignadas'
                          : 'No tienes rutinas asignadas actualmente'
                        }
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Tu entrenador te asignara rutinas personalizadas
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {legacyRoutines.map((routine) => (
                      <RoutineCard key={routine.id} routine={routine} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-4">
                {historyError ? (
                  <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="py-8 text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                      <p className="text-destructive font-medium">
                        Ocurrio un error al cargar tu historial de rutinas
                      </p>
                      <p className="text-sm text-destructive/80 mt-1">{historyError}</p>
                    </CardContent>
                  </Card>
                ) : (!historyRoutines || historyRoutines.length === 0) ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
                      <p className="text-muted-foreground">
                        Aun no tienes rutinas en tu historial
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Las rutinas finalizadas apareceran aqui
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <History className="h-5 w-5 text-muted-foreground" />
                        Historial de rutinas
                      </CardTitle>
                      <CardDescription>
                        Rutinas que has completado o que ya no estan activas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <MemberWorkoutsHistoryTable data={historyRoutines} />
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// ROUTINE CARD COMPONENT (for legacy routines)
// =============================================================================

interface RoutineCardProps {
  routine: Tables<'workouts'>
}

function RoutineCard({ routine }: RoutineCardProps) {
  const exercises = (routine.exercises as ExerciseItem[]) || []

  return (
    <Link href={`/member/workouts/${routine.id}`}>
      <Card className="h-full hover:border-lime-300 transition-colors cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Dumbbell className="h-4 w-4 text-lime-600 shrink-0" />
                <span className="truncate">{routine.name}</span>
              </CardTitle>
              {routine.description && (
                <CardDescription className="mt-1 line-clamp-2">
                  {routine.description}
                </CardDescription>
              )}
            </div>
            <Badge variant="secondary" className="shrink-0">
              {routine.workout_type ? (workoutTypeLabels[routine.workout_type] || routine.workout_type) : 'Sin tipo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* WOD Type Info */}
          {routine.workout_type === 'wod' && routine.wod_type && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Clock className="h-3 w-3" />
              <span>
                {wodTypeLabels[routine.wod_type] || routine.wod_type}
                {routine.wod_time_cap && ` - ${routine.wod_time_cap} min`}
              </span>
            </div>
          )}

          {/* Stats Row */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Dumbbell className="h-3 w-3" />
              {exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''}
            </span>
            {routine.scheduled_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(routine.scheduled_date).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            )}
          </div>

          {/* View Button */}
          <div className="flex items-center justify-end">
            <Button variant="ghost" size="sm" className="text-lime-600 group-hover:text-lime-700">
              Ver rutina
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
