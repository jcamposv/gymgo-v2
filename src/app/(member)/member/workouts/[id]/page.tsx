import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Dumbbell,
  Calendar,
  Clock,
  AlertCircle,
  Play,
  Info,
  History,
  CheckCircle2,
} from 'lucide-react'

import { getMyRoutineById } from '@/actions/routine.actions'
import {
  workoutTypeLabels,
  wodTypeLabels,
  type ExerciseItem,
} from '@/schemas/routine.schema'
import {
  difficultyLabels,
  muscleGroupLabels,
} from '@/schemas/exercise.schema'
import type { Tables } from '@/types/database.types'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CompleteWorkoutButton } from '@/components/member/complete-workout-button'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MemberRoutineDetailPage({ params }: PageProps) {
  const { id } = await params
  const { data: routine, error } = await getMyRoutineById(id)

  if (error === 'Rutina no encontrada') {
    notFound()
  }

  if (error || !routine) {
    return (
      <div className="space-y-6">
        <BackButton />
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <p className="text-destructive font-medium">
              {error || 'Ocurrio un error al cargar la rutina'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const exercises = (routine.exercises as ExerciseItem[]) || []
  const exerciseDetailsMap = new Map(
    routine.exerciseDetails?.map(e => [e.id, e]) || []
  )

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <BackButton />

      {/* Routine Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-lime-600" />
              {routine.name}
            </h1>
            {routine.description && (
              <p className="text-muted-foreground mt-1">{routine.description}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {!routine.is_active && (
              <Badge variant="outline" className="text-sm border-amber-300 bg-amber-50 text-amber-700">
                <History className="h-3 w-3 mr-1" />
                Historial
              </Badge>
            )}
            <Badge variant="secondary" className="text-sm">
              {routine.workout_type ? (workoutTypeLabels[routine.workout_type] || routine.workout_type) : 'Sin tipo'}
            </Badge>
            {routine.workout_type === 'wod' && routine.wod_type && (
              <Badge variant="outline" className="text-sm">
                {wodTypeLabels[routine.wod_type] || routine.wod_type}
              </Badge>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Dumbbell className="h-4 w-4" />
            {exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''}
          </span>
          {routine.scheduled_date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(routine.scheduled_date).toLocaleDateString('es-MX', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </span>
          )}
          {routine.wod_time_cap && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Time Cap: {routine.wod_time_cap} min
            </span>
          )}
        </div>
      </div>

      <Separator />

      {/* Exercises Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Ejercicios</h2>

        {exercises.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
              <p className="text-muted-foreground">
                No se encontraron ejercicios para esta rutina
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {exercises.map((exercise, index) => {
              const details = exerciseDetailsMap.get(exercise.exercise_id)
              return (
                <ExerciseCard
                  key={`${exercise.exercise_id}-${index}`}
                  exercise={exercise}
                  details={details}
                  index={index}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Complete Workout Section */}
      {routine.is_active && (
        <>
          <Separator />
          <div className="space-y-4">
            <Card className="border-lime-200/50 bg-gradient-to-br from-lime-50/30 to-white">
              <CardContent className="py-6">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Terminaste tu entrenamiento?</span>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Registra tu progreso para ver tus avances semanales y mantener tu racha de entrenamientos.
                  </p>
                  <div className="max-w-sm mx-auto">
                    <CompleteWorkoutButton
                      workoutId={routine.id}
                      workoutName={routine.name}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

// =============================================================================
// BACK BUTTON
// =============================================================================

function BackButton() {
  return (
    <Link href="/member/workouts">
      <Button variant="ghost" size="sm" className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Volver a mis rutinas
      </Button>
    </Link>
  )
}

// =============================================================================
// EXERCISE CARD
// =============================================================================

interface ExerciseCardProps {
  exercise: ExerciseItem
  details?: Tables<'exercises'>
  index: number
}

function ExerciseCard({ exercise, details, index }: ExerciseCardProps) {
  const hasMedia = details?.gif_url || details?.video_url

  return (
    <Card className="overflow-hidden">
      {/* Media Section */}
      {hasMedia && (
        <div className="relative aspect-video bg-muted">
          {details?.gif_url ? (
            <img
              src={details.gif_url}
              alt={exercise.exercise_name}
              className="w-full h-full object-cover"
            />
          ) : details?.video_url ? (
            <div className="relative w-full h-full">
              {details.video_url.includes('youtube') || details.video_url.includes('youtu.be') ? (
                <iframe
                  src={getYoutubeEmbedUrl(details.video_url)}
                  title={exercise.exercise_name}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={details.video_url}
                  className="w-full h-full object-cover"
                  controls
                  preload="metadata"
                />
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* No Media Placeholder */}
      {!hasMedia && (
        <div className="aspect-video bg-muted flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Sin imagen</p>
          </div>
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-lime-100 text-lime-700 font-bold text-sm shrink-0">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base leading-tight">
              {exercise.exercise_name}
            </CardTitle>
            {details?.category && (
              <CardDescription className="text-xs mt-1">
                {details.category}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Sets x Reps */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {exercise.sets && (
            <div className="bg-muted/50 rounded-md p-2 text-center">
              <div className="font-semibold text-lg">{exercise.sets}</div>
              <div className="text-xs text-muted-foreground">Series</div>
            </div>
          )}
          {exercise.reps && (
            <div className="bg-muted/50 rounded-md p-2 text-center">
              <div className="font-semibold text-lg">{exercise.reps}</div>
              <div className="text-xs text-muted-foreground">Reps</div>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="flex flex-wrap gap-2">
          {exercise.weight && (
            <Badge variant="outline" className="text-xs">
              {exercise.weight}
            </Badge>
          )}
          {exercise.rest_seconds && (
            <Badge variant="outline" className="text-xs">
              Descanso: {exercise.rest_seconds}s
            </Badge>
          )}
          {exercise.tempo && (
            <Badge variant="outline" className="text-xs">
              Tempo: {exercise.tempo}
            </Badge>
          )}
        </div>

        {/* Muscle Groups */}
        {details?.muscle_groups && details.muscle_groups.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(details.muscle_groups as string[]).slice(0, 3).map((muscle) => (
              <Badge key={muscle} variant="secondary" className="text-xs">
                {muscleGroupLabels[muscle] || muscle}
              </Badge>
            ))}
          </div>
        )}

        {/* Difficulty */}
        {details?.difficulty && (
          <div className="text-xs text-muted-foreground">
            Dificultad: {difficultyLabels[details.difficulty] || details.difficulty}
          </div>
        )}

        {/* Notes */}
        {exercise.notes && (
          <div className="text-sm text-muted-foreground border-l-2 border-lime-300 pl-3 italic">
            {exercise.notes}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// HELPERS
// =============================================================================

function getYoutubeEmbedUrl(url: string): string {
  let videoId = ''

  if (url.includes('youtube.com/watch')) {
    const urlParams = new URL(url).searchParams
    videoId = urlParams.get('v') || ''
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] || ''
  } else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('youtube.com/embed/')[1]?.split('?')[0] || ''
  }

  return videoId ? `https://www.youtube.com/embed/${videoId}` : url
}
