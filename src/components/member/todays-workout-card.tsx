'use client'

import Link from 'next/link'
import { Dumbbell, ChevronRight, Play, Calendar, Zap } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WeeklyProgressBadge } from './program-progress-card'
import type { Tables } from '@/types/database.types'
import type { WeeklyProgress } from '@/types/program.types'
import type { ExerciseItem } from '@/schemas/routine.schema'

// =============================================================================
// TODAY'S WORKOUT CARD
// =============================================================================

interface TodaysWorkoutCardProps {
  workout: Tables<'workouts'> | null
  progress: WeeklyProgress | null
  programName?: string
  nextDayNumber: number
  hasActiveProgram: boolean
}

export function TodaysWorkoutCard({
  workout,
  progress,
  programName,
  nextDayNumber,
  hasActiveProgram,
}: TodaysWorkoutCardProps) {
  const exercises = workout ? ((workout.exercises as ExerciseItem[]) || []) : []

  // No active program or workout
  if (!workout) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
          <p className="text-muted-foreground font-medium">
            {hasActiveProgram
              ? 'Has completado todos los entrenamientos de hoy'
              : 'No tienes un programa activo'
            }
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {hasActiveProgram
              ? 'Descansa y recuperate para tu proximo entrenamiento'
              : 'Tu entrenador te asignara un programa personalizado'
            }
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-lime-200 shadow-sm">
      {/* Header with program info */}
      <div className="bg-gradient-to-r from-lime-500 to-lime-600 p-4 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lime-100 text-sm font-medium">
              {programName || 'Entrenamiento de hoy'}
            </p>
            <h3 className="text-xl font-bold mt-1">
              Dia {nextDayNumber} - {workout.name.replace(/^Dia \d+ - /, '')}
            </h3>
          </div>
          <Badge className="bg-white/20 text-white border-0">
            <Zap className="h-3 w-3 mr-1" />
            HOY
          </Badge>
        </div>
        {progress && (
          <div className="mt-3 flex items-center gap-2 text-lime-100 text-sm">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Semana {progress.currentWeek} &middot; {progress.daysCompletedThisWeek}/{progress.daysPerWeek} dias
            </span>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Workout description */}
        {workout.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {workout.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Dumbbell className="h-4 w-4" />
            {exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Exercise preview */}
        {exercises.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Ejercicios
            </p>
            <div className="grid grid-cols-2 gap-2">
              {exercises.slice(0, 4).map((ex, i) => (
                <div
                  key={i}
                  className="bg-muted/50 rounded-md px-2 py-1.5 text-xs truncate"
                >
                  {ex.exercise_name}
                </div>
              ))}
              {exercises.length > 4 && (
                <div className="bg-muted/50 rounded-md px-2 py-1.5 text-xs text-muted-foreground">
                  +{exercises.length - 4} mas
                </div>
              )}
            </div>
          </div>
        )}

        {/* CTA Button */}
        <Link href={`/member/workouts/${workout.id}`} className="block">
          <Button className="w-full bg-lime-600 hover:bg-lime-700 text-white" size="lg">
            <Play className="h-4 w-4 mr-2" />
            Comenzar Entrenamiento
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// COMPACT WORKOUT CARD (for list view)
// =============================================================================

interface CompactWorkoutCardProps {
  workout: Tables<'workouts'>
  dayNumber?: number
  isToday?: boolean
  isCompleted?: boolean
}

export function CompactWorkoutCard({
  workout,
  dayNumber,
  isToday,
  isCompleted,
}: CompactWorkoutCardProps) {
  const exercises = (workout.exercises as ExerciseItem[]) || []

  return (
    <Link href={`/member/workouts/${workout.id}`}>
      <Card
        className={`hover:border-lime-300 transition-colors cursor-pointer ${
          isToday ? 'border-lime-400 bg-lime-50/50' : ''
        } ${isCompleted ? 'opacity-60' : ''}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              {dayNumber && (
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${
                    isCompleted
                      ? 'bg-lime-100 text-lime-700'
                      : isToday
                      ? 'bg-lime-600 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {dayNumber}
                </div>
              )}
              <div className="min-w-0">
                <h4 className="font-medium text-sm truncate">
                  {workout.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {exercises.length} ejercicios
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isToday && (
                <Badge variant="secondary" className="bg-lime-100 text-lime-700 text-xs">
                  Hoy
                </Badge>
              )}
              {isCompleted && (
                <Badge variant="secondary" className="text-xs">
                  Completado
                </Badge>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
