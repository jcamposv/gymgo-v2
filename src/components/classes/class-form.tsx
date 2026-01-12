'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import type { Tables } from '@/types/database.types'
import { createClassData, updateClassData } from '@/actions/class.actions'
import { classSchema, type ClassFormData } from '@/schemas/class.schema'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Switch } from '@/components/ui/switch'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { InstructorSelect } from '@/components/shared/instructor-select'

interface ClassFormProps {
  classData?: Tables<'classes'>
  mode: 'create' | 'edit'
}

const CLASS_TYPES = [
  { value: 'crossfit', label: 'CrossFit' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'pilates', label: 'Pilates' },
  { value: 'spinning', label: 'Spinning' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'strength', label: 'Fuerza' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'functional', label: 'Funcional' },
  { value: 'boxing', label: 'Box' },
  { value: 'mma', label: 'MMA' },
  { value: 'stretching', label: 'Estiramiento' },
  { value: 'open_gym', label: 'Open Gym' },
  { value: 'personal', label: 'Personal Training' },
  { value: 'other', label: 'Otro' },
]

// Format datetime for input
const formatDateTimeLocal = (dateString: string | null | undefined) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toISOString().slice(0, 16)
}

export function ClassForm({ classData, mode }: ClassFormProps) {
  const router = useRouter()

  const form = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: classData?.name ?? '',
      description: classData?.description ?? '',
      class_type: classData?.class_type ?? '',
      start_time: formatDateTimeLocal(classData?.start_time) || '',
      end_time: formatDateTimeLocal(classData?.end_time) || '',
      max_capacity: classData?.max_capacity ?? 20,
      waitlist_enabled: classData?.waitlist_enabled ?? true,
      max_waitlist: classData?.max_waitlist ?? 5,
      instructor_id: classData?.instructor_id ?? undefined,
      instructor_name: classData?.instructor_name ?? '',
      location: classData?.location ?? '',
      booking_opens_hours: classData?.booking_opens_hours ?? 168,
      booking_closes_minutes: classData?.booking_closes_minutes ?? 60,
      cancellation_deadline_hours: classData?.cancellation_deadline_hours ?? 2,
      is_recurring: classData?.is_recurring ?? false,
      recurrence_rule: classData?.recurrence_rule ?? '',
    },
  })

  const onSubmit = async (data: ClassFormData) => {
    try {
      const result = mode === 'create'
        ? await createClassData(data)
        : await updateClassData(classData!.id, data)

      if (result.success) {
        toast.success(result.message)
        router.push('/dashboard/classes')
      } else {
        toast.error(result.message)
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, errors]) => {
            form.setError(field as keyof ClassFormData, {
              message: errors[0],
            })
          })
        }
      }
    } catch {
      toast.error('Error al guardar la clase')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informacion de la clase</CardTitle>
              <CardDescription>
                Datos basicos de la clase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la clase *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: WOD del dia, Yoga matutino..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="class_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de clase</FormLabel>
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
                          {CLASS_TYPES.map((type) => (
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
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripcion</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe la clase, que se trabajara, nivel requerido..."
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
              <CardTitle>Horario</CardTitle>
              <CardDescription>
                Fecha y hora de la clase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inicio *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fin *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instructor y ubicacion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="instructor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructor</FormLabel>
                      <FormControl>
                        <InstructorSelect
                          value={field.value}
                          onValueChange={(instructorId, instructorName) => {
                            field.onChange(instructorId)
                            form.setValue('instructor_name', instructorName ?? '')
                          }}
                          placeholder="Seleccionar instructor..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicacion / Sala</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Sala 1, Box principal..."
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capacidad y reservas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="max_capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidad maxima</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={500}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="booking_opens_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reserva abre (horas antes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={720}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="booking_closes_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reserva cierra (min antes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={1440}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="waitlist_enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Lista de espera</FormLabel>
                        <FormDescription>
                          Permitir lista de espera cuando la clase este llena
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
                  name="max_waitlist"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max. lista de espera</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="cancellation_deadline_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite cancelacion (horas antes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={72}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Horas antes de la clase en que se permite cancelar sin penalizacion
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/classes')}
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
                'Crear clase'
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
