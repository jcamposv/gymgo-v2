'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, GripVertical, Trash2, Plus } from 'lucide-react'

import { createRoutineData, updateRoutineData } from '@/actions/routine.actions'
import {
  routineSchema,
  workoutTypes,
  wodTypes,
  type RoutineFormData,
  type ExerciseItem,
} from '@/schemas/routine.schema'
import { ExerciseSelector } from './exercise-selector'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

interface Exercise {
  id: string
  name: string
  category: string | null
  muscle_groups: string[] | null
  difficulty: string
  gif_url: string | null
  is_global: boolean
}

interface Routine {
  id: string
  name: string
  description: string | null
  workout_type: string
  wod_type: string | null
  wod_time_cap: number | null
  exercises: ExerciseItem[]
  assigned_to_member_id: string | null
  scheduled_date: string | null
  is_template: boolean
  is_active: boolean
}

interface RoutineFormProps {
  routine?: Routine
  mode: 'create' | 'edit'
}

export function RoutineForm({ routine, mode }: RoutineFormProps) {
  const router = useRouter()

  const defaultExercises: ExerciseItem[] = routine?.exercises || []

  const form = useForm<RoutineFormData>({
    resolver: zodResolver(routineSchema),
    defaultValues: {
      name: routine?.name ?? '',
      description: routine?.description ?? '',
      workout_type: (routine?.workout_type as 'routine' | 'wod' | 'program') ?? 'routine',
      wod_type: routine?.wod_type as 'amrap' | 'emom' | 'for_time' | 'tabata' | 'rounds' | null ?? null,
      wod_time_cap: routine?.wod_time_cap ?? null,
      exercises: defaultExercises,
      assigned_to_member_id: routine?.assigned_to_member_id ?? null,
      scheduled_date: routine?.scheduled_date ?? null,
      is_template: routine?.is_template ?? true,
      is_active: routine?.is_active ?? true,
    },
  })

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'exercises',
  })

  const watchedWorkoutType = form.watch('workout_type')
  const selectedExerciseIds = fields.map(f => f.exercise_id)

  const onSubmit = async (data: RoutineFormData) => {
    try {
      const result = mode === 'create'
        ? await createRoutineData(data)
        : await updateRoutineData(routine!.id, data)

      if (result.success) {
        toast.success(result.message)
        router.push('/dashboard/routines')
      } else {
        toast.error(result.message)
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, errors]) => {
            form.setError(field as keyof RoutineFormData, {
              message: errors[0],
            })
          })
        }
      }
    } catch {
      toast.error('Error al guardar la rutina')
    }
  }

  const handleAddExercise = (exercise: Exercise) => {
    append({
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      sets: 3,
      reps: '10',
      weight: '',
      rest_seconds: 60,
      tempo: '',
      notes: '',
      order: fields.length,
    })
  }

  const moveExercise = (fromIndex: number, toIndex: number) => {
    if (toIndex >= 0 && toIndex < fields.length) {
      move(fromIndex, toIndex)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informacion basica</CardTitle>
                <CardDescription>
                  Nombre y tipo de rutina
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Rutina de fuerza - Dia A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workout_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de entrenamiento *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {workoutTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripcion</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripcion de la rutina..."
                          rows={3}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuracion</CardTitle>
                <CardDescription>
                  Opciones de la rutina
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {watchedWorkoutType === 'wod' && (
                  <>
                    <FormField
                      control={form.control}
                      name="wod_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de WOD</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value ?? undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {wodTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="wod_time_cap"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time Cap (minutos)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="120"
                              placeholder="20"
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="scheduled_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha programada</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Opcional - para asignar a un dia especifico
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_template"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Plantilla</FormLabel>
                        <FormDescription className="text-xs">
                          Disponible para asignar a miembros
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Activa</FormLabel>
                        <FormDescription className="text-xs">
                          Rutina disponible para uso
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ejercicios</CardTitle>
                  <CardDescription>
                    Agrega y configura los ejercicios de la rutina
                  </CardDescription>
                </div>
                <ExerciseSelector
                  onSelect={handleAddExercise}
                  selectedIds={selectedExerciseIds}
                />
              </div>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    No hay ejercicios agregados
                  </p>
                  <ExerciseSelector
                    onSelect={handleAddExercise}
                    selectedIds={selectedExerciseIds}
                    trigger={
                      <Button type="button" variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar primer ejercicio
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30"
                    >
                      <div className="flex flex-col gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveExercise(index, index - 1)}
                          disabled={index === 0}
                        >
                          <GripVertical className="h-4 w-4 rotate-90" />
                        </Button>
                        <span className="text-sm font-medium text-center">
                          {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveExercise(index, index + 1)}
                          disabled={index === fields.length - 1}
                        >
                          <GripVertical className="h-4 w-4 rotate-90" />
                        </Button>
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{field.exercise_name}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
                          <FormField
                            control={form.control}
                            name={`exercises.${index}.sets`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Series</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    placeholder="3"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`exercises.${index}.reps`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Reps</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="8-12"
                                    {...field}
                                    value={field.value ?? ''}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`exercises.${index}.weight`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Peso</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="50kg"
                                    {...field}
                                    value={field.value ?? ''}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`exercises.${index}.rest_seconds`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Descanso (seg)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="60"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`exercises.${index}.tempo`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Tempo</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="3-1-2-0"
                                    {...field}
                                    value={field.value ?? ''}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`exercises.${index}.notes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Notas</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Instrucciones adicionales..."
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {form.formState.errors.exercises && (
                <p className="text-sm text-destructive mt-2">
                  {form.formState.errors.exercises.message}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/routines')}
              disabled={form.formState.isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create' ? 'Creando...' : 'Guardando...'}
                </>
              ) : mode === 'create' ? (
                'Crear rutina'
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
