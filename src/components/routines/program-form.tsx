'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Calendar, Target } from 'lucide-react'
import { z } from 'zod'

import { createProgram, updateProgram } from '@/actions/program.actions'
import { ProgramDaysEditor } from './program-days-editor'
import { exerciseItemSchema, type ExerciseItem } from '@/schemas/routine.schema'
import { DURATION_OPTIONS, DAYS_PER_WEEK_OPTIONS } from '@/types/program.types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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

// =============================================================================
// FORM SCHEMA
// =============================================================================

const programDaySchema = z.object({
  dayNumber: z.number().min(1).max(6),
  name: z.string().min(1, 'El nombre es requerido'),
  focus: z.string().optional(),
  exercises: z.array(exerciseItemSchema).min(1, 'Agrega al menos un ejercicio'),
})

const programFormSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(2, 'Minimo 2 caracteres')
    .max(100, 'Maximo 100 caracteres'),
  description: z
    .string()
    .max(1000, 'Maximo 1000 caracteres')
    .optional()
    .nullable(),
  durationWeeks: z.number().refine((v) => [4, 6, 8, 12].includes(v)),
  daysPerWeek: z.number().min(2).max(6),
  days: z.array(programDaySchema),
  assignedToMemberId: z.string().uuid().optional().nullable(),
  isTemplate: z.boolean(),
})

type ProgramFormData = z.infer<typeof programFormSchema>

// =============================================================================
// COMPONENT
// =============================================================================

interface ProgramDayData {
  id?: string
  dayNumber: number
  name: string
  focus?: string
  exercises: ExerciseItem[]
}

interface ProgramData {
  id: string
  name: string
  description?: string | null
  durationWeeks: number
  daysPerWeek: number
  isTemplate?: boolean | null
  isActive?: boolean | null
  assignedToMemberId?: string | null
  days: ProgramDayData[]
}

interface ProgramFormProps {
  memberId?: string
  memberName?: string
  program?: ProgramData
  mode?: 'create' | 'edit'
}

export function ProgramForm({ memberId, memberName, program, mode = 'create' }: ProgramFormProps) {
  const router = useRouter()
  const isEditing = mode === 'edit' && program

  const form = useForm<ProgramFormData>({
    resolver: zodResolver(programFormSchema),
    defaultValues: {
      name: program?.name || '',
      description: program?.description || '',
      durationWeeks: program?.durationWeeks || 8,
      daysPerWeek: program?.daysPerWeek || 4,
      days: program?.days?.map(d => ({
        dayNumber: d.dayNumber,
        name: d.name,
        focus: d.focus || '',
        exercises: d.exercises,
      })) || [],
      assignedToMemberId: program?.assignedToMemberId || memberId || null,
      isTemplate: program?.isTemplate ?? !memberId,
    },
  })

  const daysPerWeek = form.watch('daysPerWeek')
  const days = form.watch('days')

  const onSubmit = async (data: ProgramFormData) => {
    // Validate all days have exercises
    const invalidDays = data.days.filter((d) => d.exercises.length === 0)
    if (invalidDays.length > 0) {
      toast.error('Todos los dias deben tener al menos un ejercicio')
      return
    }

    // Validate we have the right number of days
    if (data.days.length !== data.daysPerWeek) {
      toast.error(`Debes crear ${data.daysPerWeek} dias de entrenamiento`)
      return
    }

    try {
      if (isEditing) {
        // Update existing program
        const result = await updateProgram(program!.id, {
          name: data.name,
          description: data.description || undefined,
          durationWeeks: data.durationWeeks,
          daysPerWeek: data.daysPerWeek,
          isTemplate: data.isTemplate,
          isActive: program!.isActive ?? true,
          days: data.days.map((d, idx) => ({
            id: program!.days[idx]?.id, // Preserve existing day IDs
            dayNumber: d.dayNumber,
            name: d.name,
            focus: d.focus,
            exercises: d.exercises,
          })),
        })

        if (result.success) {
          toast.success(result.message)
          router.push(`/dashboard/routines/${program!.id}`)
        } else {
          toast.error(result.message)
        }
      } else {
        // Create new program
        const result = await createProgram({
          name: data.name,
          description: data.description || undefined,
          durationWeeks: data.durationWeeks,
          daysPerWeek: data.daysPerWeek,
          days: data.days,
          assignedToMemberId: data.assignedToMemberId || undefined,
          isTemplate: data.isTemplate,
        })

        if (result.success) {
          toast.success(result.message)
          router.push('/dashboard/routines')
        } else {
          toast.error(result.message)
        }
      }
    } catch {
      toast.error(isEditing ? 'Error al actualizar el programa' : 'Error al crear el programa')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          {/* Program Info */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-lime-600" />
                  Informacion del programa
                </CardTitle>
                <CardDescription>
                  Nombre y duracion del programa de entrenamiento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del programa *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Fuerza Total - 8 Semanas"
                          {...field}
                        />
                      </FormControl>
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
                          placeholder="Descripcion del programa..."
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
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-lime-600" />
                  Estructura del programa
                </CardTitle>
                <CardDescription>
                  Duracion y frecuencia semanal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="durationWeeks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duracion *</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(parseInt(v))}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar duracion" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DURATION_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value.toString()}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        El programa se repetira semanalmente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="daysPerWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dias por semana *</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          const newValue = parseInt(v)
                          field.onChange(newValue)
                          // Clear days if reducing
                          if (days.length > newValue) {
                            form.setValue('days', days.slice(0, newValue))
                          }
                        }}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar dias" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DAYS_PER_WEEK_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value.toString()}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        Cada dia tendra ejercicios diferentes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isTemplate"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Guardar como plantilla</FormLabel>
                        <FormDescription className="text-xs">
                          Disponible para asignar a otros miembros
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

                {memberName && (
                  <div className="rounded-lg border p-3 bg-lime-50/50">
                    <p className="text-sm font-medium">Asignado a:</p>
                    <p className="text-sm text-muted-foreground">{memberName}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Program Days */}
          <Card>
            <CardHeader>
              <CardTitle>Dias de entrenamiento</CardTitle>
              <CardDescription>
                Configura los ejercicios para cada dia de la semana.
                El Dia 1 se entrena el primer dia, Dia 2 el segundo, etc.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProgramDaysEditor
                control={form.control}
                watch={form.watch}
                setValue={form.setValue}
              />
              {form.formState.errors.days && (
                <p className="text-sm text-destructive mt-2">
                  {form.formState.errors.days.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          {days.length > 0 && (
            <Card className="bg-muted/30">
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Duracion:</span>{' '}
                    <span className="font-medium">{form.watch('durationWeeks')} semanas</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Frecuencia:</span>{' '}
                    <span className="font-medium">{daysPerWeek} dias/semana</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total entrenamientos:</span>{' '}
                    <span className="font-medium">
                      {form.watch('durationWeeks') * daysPerWeek} sesiones
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dias configurados:</span>{' '}
                    <span className="font-medium">{days.length}/{daysPerWeek}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/routines')}
              disabled={form.formState.isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || days.length !== daysPerWeek}
              className="bg-lime-600 hover:bg-lime-700"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Guardando...' : 'Creando...'}
                </>
              ) : (
                isEditing ? 'Guardar cambios' : 'Crear programa'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
