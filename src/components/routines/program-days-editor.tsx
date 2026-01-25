'use client'

import { useState } from 'react'
import { useFieldArray, type Control, type UseFormSetValue, type UseFormWatch } from 'react-hook-form'
import { GripVertical, Trash2, Plus, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react'

import { ExerciseSelector } from './exercise-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import type { ExerciseItem } from '@/schemas/routine.schema'

interface Exercise {
  id: string
  name: string
  category: string | null
  muscle_groups: string[] | null
  difficulty: string | null
  gif_url: string | null
  is_global: boolean | null
}

interface ProgramDay {
  dayNumber: number
  name: string
  focus?: string
  exercises: ExerciseItem[]
}

interface ProgramFormData {
  name: string
  description?: string | null
  durationWeeks: number
  daysPerWeek: number
  days: ProgramDay[]
  assignedToMemberId?: string | null
  isTemplate: boolean
}

interface ProgramDaysEditorProps {
  control: Control<ProgramFormData>
  watch: UseFormWatch<ProgramFormData>
  setValue: UseFormSetValue<ProgramFormData>
}

export function ProgramDaysEditor({
  control,
  watch,
  setValue,
}: ProgramDaysEditorProps) {
  const [openDays, setOpenDays] = useState<number[]>([0])
  const daysPerWeek = watch('daysPerWeek')
  const days = watch('days')

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'days',
  })

  const toggleDay = (index: number) => {
    setOpenDays((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    )
  }

  const handleAddDay = () => {
    if (fields.length >= daysPerWeek) return

    const dayNumber = fields.length + 1
    const defaultNames: Record<number, string> = {
      1: 'Pecho + Triceps',
      2: 'Espalda + Biceps',
      3: 'Piernas',
      4: 'Hombros + Core',
      5: 'Full Body',
      6: 'Cardio + Movilidad',
    }

    append({
      dayNumber,
      name: `Dia ${dayNumber} - ${defaultNames[dayNumber] || 'Entrenamiento'}`,
      focus: defaultNames[dayNumber] || '',
      exercises: [],
    })

    setOpenDays((prev) => [...prev, fields.length])
  }

  const handleRemoveDay = (index: number) => {
    remove(index)
    // Renumber remaining days
    const remaining = days.filter((_, i) => i !== index)
    remaining.forEach((day, i) => {
      setValue(`days.${i}.dayNumber`, i + 1)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Dias del programa</h3>
          <p className="text-sm text-muted-foreground">
            {fields.length} de {daysPerWeek} dias configurados
          </p>
        </div>
        {fields.length < daysPerWeek && (
          <Button type="button" variant="outline" size="sm" onClick={handleAddDay}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar dia
          </Button>
        )}
      </div>

      {fields.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
            <p className="text-muted-foreground mb-4">
              Agrega los dias de entrenamiento
            </p>
            <Button type="button" variant="outline" onClick={handleAddDay}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar primer dia
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {fields.map((field, dayIndex) => (
            <ProgramDayCard
              key={field.id}
              control={control}
              dayIndex={dayIndex}
              isOpen={openDays.includes(dayIndex)}
              onToggle={() => toggleDay(dayIndex)}
              onRemove={() => handleRemoveDay(dayIndex)}
              canRemove={fields.length > 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// PROGRAM DAY CARD
// =============================================================================

interface ProgramDayCardProps {
  control: Control<ProgramFormData>
  dayIndex: number
  isOpen: boolean
  onToggle: () => void
  onRemove: () => void
  canRemove: boolean
}

function ProgramDayCard({
  control,
  dayIndex,
  isOpen,
  onToggle,
  onRemove,
  canRemove,
}: ProgramDayCardProps) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: `days.${dayIndex}.exercises`,
  })

  const selectedExerciseIds = fields.map((f) => f.exercise_id)

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
    <Card className={isOpen ? 'ring-2 ring-lime-200' : ''}>
      <CardHeader
        className="cursor-pointer hover:bg-muted/30 transition-colors py-3"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-lime-100 text-lime-700 font-bold text-sm">
              {dayIndex + 1}
            </div>
            <FormField
              control={control}
              name={`days.${dayIndex}.name`}
              render={({ field }) => (
                <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                  <Input
                    {...field}
                    className="font-medium border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
                    placeholder={`Dia ${dayIndex + 1}`}
                  />
                </div>
              )}
            />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {fields.length} ejercicios
            </Badge>
            {canRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4 pt-0">
          {/* Focus Field */}
          <FormField
            control={control}
            name={`days.${dayIndex}.focus`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Enfoque del dia</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ej: Pecho + Triceps"
                    value={field.value || ''}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Exercise List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Ejercicios</span>
              <ExerciseSelector
                onSelect={handleAddExercise}
                selectedIds={selectedExerciseIds}
              />
            </div>

            {fields.length === 0 ? (
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Sin ejercicios
                </p>
                <ExerciseSelector
                  onSelect={handleAddExercise}
                  selectedIds={selectedExerciseIds}
                  trigger={
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar ejercicio
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="space-y-2">
                {fields.map((field, exIndex) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => moveExercise(exIndex, exIndex - 1)}
                        disabled={exIndex === 0}
                      >
                        <GripVertical className="h-3 w-3 rotate-90" />
                      </Button>
                      <span className="text-xs font-medium text-center">
                        {exIndex + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => moveExercise(exIndex, exIndex + 1)}
                        disabled={exIndex === fields.length - 1}
                      >
                        <GripVertical className="h-3 w-3 rotate-90" />
                      </Button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block">
                        {field.exercise_name}
                      </span>
                      <div className="flex items-center gap-3 mt-1">
                        <FormField
                          control={control}
                          name={`days.${dayIndex}.exercises.${exIndex}.sets`}
                          render={({ field: f }) => (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="1"
                                className="w-14 h-7 text-xs"
                                value={f.value ?? ''}
                                onChange={(e) =>
                                  f.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                                }
                              />
                              <span className="text-xs text-muted-foreground">sets</span>
                            </div>
                          )}
                        />
                        <FormField
                          control={control}
                          name={`days.${dayIndex}.exercises.${exIndex}.reps`}
                          render={({ field: f }) => (
                            <div className="flex items-center gap-1">
                              <Input
                                className="w-16 h-7 text-xs"
                                placeholder="8-12"
                                value={f.value ?? ''}
                                onChange={(e) => f.onChange(e.target.value)}
                              />
                              <span className="text-xs text-muted-foreground">reps</span>
                            </div>
                          )}
                        />
                        <FormField
                          control={control}
                          name={`days.${dayIndex}.exercises.${exIndex}.rest_seconds`}
                          render={({ field: f }) => (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                className="w-14 h-7 text-xs"
                                value={f.value ?? ''}
                                onChange={(e) =>
                                  f.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                                }
                              />
                              <span className="text-xs text-muted-foreground">seg</span>
                            </div>
                          )}
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive shrink-0"
                      onClick={() => remove(exIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
