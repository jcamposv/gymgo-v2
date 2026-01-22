import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Pencil, Globe } from 'lucide-react'

import { getExercise } from '@/actions/exercise.actions'
import { ExerciseMediaPlayer } from '@/components/exercises/exercise-media-player'
import {
  categoryLabels,
  difficultyLabels,
  muscleGroupLabels,
  equipmentLabels,
} from '@/schemas/exercise.schema'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface ExercisePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ExercisePageProps) {
  const { id } = await params
  const { data: exercise } = await getExercise(id)
  return {
    title: exercise ? `${exercise.name} | GymGo` : 'Ejercicio | GymGo',
  }
}

export default async function ExercisePage({ params }: ExercisePageProps) {
  const { id } = await params
  const { data: exercise, error } = await getExercise(id)

  if (error || !exercise) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/exercises">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{exercise.name}</h1>
              {exercise.is_global && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Global
                </Badge>
              )}
            </div>
            {exercise.description && (
              <p className="text-muted-foreground">{exercise.description}</p>
            )}
          </div>
        </div>
        {!exercise.is_global && (
          <Button asChild>
            <Link href={`/dashboard/exercises/${exercise.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Demostracion</CardTitle>
          </CardHeader>
          <CardContent>
            <ExerciseMediaPlayer
              videoUrl={exercise.video_url}
              gifUrl={exercise.gif_url}
              thumbnailUrl={exercise.thumbnail_url}
              title={exercise.name}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clasificacion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Categoria</p>
              {exercise.category ? (
                <Badge variant="outline">
                  {categoryLabels[exercise.category] || exercise.category}
                </Badge>
              ) : (
                <p className="text-sm">Sin categoria</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Dificultad</p>
              <Badge
                variant={
                  exercise.difficulty === 'beginner'
                    ? 'secondary'
                    : exercise.difficulty === 'intermediate'
                    ? 'default'
                    : 'destructive'
                }
              >
                {exercise.difficulty ? (difficultyLabels[exercise.difficulty] || exercise.difficulty) : 'Sin definir'}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Grupos musculares</p>
              {exercise.muscle_groups && exercise.muscle_groups.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {exercise.muscle_groups.map((muscle) => (
                    <Badge key={muscle} variant="secondary">
                      {muscleGroupLabels[muscle] || muscle}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm">No especificado</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Equipo</p>
              {exercise.equipment && exercise.equipment.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {exercise.equipment.map((equip) => (
                    <Badge key={equip} variant="outline">
                      {equipmentLabels[equip] || equip}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm">Sin equipo</p>
              )}
            </div>

            {(exercise.name_es || exercise.name_en) && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nombres alternativos</p>
                <div className="space-y-1 text-sm">
                  {exercise.name_es && <p>ES: {exercise.name_es}</p>}
                  {exercise.name_en && <p>EN: {exercise.name_en}</p>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {exercise.instructions && exercise.instructions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Instrucciones</CardTitle>
            <CardDescription>
              Pasos para ejecutar el ejercicio correctamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2">
              {exercise.instructions.map((instruction, index) => (
                <li key={index} className="text-sm">
                  {instruction}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {exercise.tips && exercise.tips.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tips</CardTitle>
              <CardDescription>
                Consejos para mejorar la ejecucion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {exercise.tips.map((tip, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {exercise.common_mistakes && exercise.common_mistakes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Errores comunes</CardTitle>
              <CardDescription>
                Errores frecuentes a evitar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {exercise.common_mistakes.map((mistake, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="text-destructive">•</span>
                    {mistake}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
