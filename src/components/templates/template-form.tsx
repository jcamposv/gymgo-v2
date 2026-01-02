'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { createClassTemplateData, updateClassTemplateData } from '@/actions/template.actions'
import {
  classTemplateSchema,
  daysOfWeek,
  classTypes,
  type ClassTemplateFormData,
} from '@/schemas/template.schema'

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

interface ClassTemplate {
  id: string
  name: string
  description: string | null
  class_type: string | null
  day_of_week: number
  start_time: string
  end_time: string
  max_capacity: number
  waitlist_enabled: boolean
  max_waitlist: number
  instructor_id: string | null
  instructor_name: string | null
  location: string | null
  booking_opens_hours: number
  booking_closes_minutes: number
  cancellation_deadline_hours: number
  is_active: boolean
}

interface TemplateFormProps {
  template?: ClassTemplate
  mode: 'create' | 'edit'
}

export function TemplateForm({ template, mode }: TemplateFormProps) {
  const router = useRouter()

  const form = useForm<ClassTemplateFormData>({
    resolver: zodResolver(classTemplateSchema),
    defaultValues: {
      name: template?.name ?? '',
      description: template?.description ?? '',
      class_type: template?.class_type ?? null,
      day_of_week: template?.day_of_week ?? 1,
      start_time: template?.start_time ?? '09:00',
      end_time: template?.end_time ?? '10:00',
      max_capacity: template?.max_capacity ?? 20,
      waitlist_enabled: template?.waitlist_enabled ?? true,
      max_waitlist: template?.max_waitlist ?? 5,
      instructor_id: template?.instructor_id ?? null,
      instructor_name: template?.instructor_name ?? '',
      location: template?.location ?? '',
      booking_opens_hours: template?.booking_opens_hours ?? 168,
      booking_closes_minutes: template?.booking_closes_minutes ?? 60,
      cancellation_deadline_hours: template?.cancellation_deadline_hours ?? 2,
      is_active: template?.is_active ?? true,
    },
  })

  const watchedWaitlistEnabled = form.watch('waitlist_enabled')

  const onSubmit = async (data: ClassTemplateFormData) => {
    try {
      const result = mode === 'create'
        ? await createClassTemplateData(data)
        : await updateClassTemplateData(template!.id, data)

      if (result.success) {
        toast.success(result.message)
        router.push('/dashboard/templates')
      } else {
        toast.error(result.message)
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, errors]) => {
            form.setError(field as keyof ClassTemplateFormData, {
              message: errors[0],
            })
          })
        }
      }
    } catch {
      toast.error('Error al guardar la plantilla')
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
                  Nombre y tipo de clase
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la clase *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: CrossFit WOD" {...field} />
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
                          {classTypes.map((type) => (
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
                          placeholder="Descripcion de la clase..."
                          rows={3}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
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
                          Incluir en la generacion de clases
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

            <Card>
              <CardHeader>
                <CardTitle>Horario</CardTitle>
                <CardDescription>
                  Dia y hora de la clase
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="day_of_week"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dia de la semana *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar dia" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {daysOfWeek.map((day) => (
                            <SelectItem key={day.value} value={String(day.value)}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 grid-cols-2">
                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora inicio *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
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
                        <FormLabel>Hora fin *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="instructor_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructor</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nombre del instructor"
                          {...field}
                          value={field.value ?? ''}
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
                      <FormLabel>Ubicacion</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Sala principal"
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
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Capacidad y reservas</CardTitle>
              <CardDescription>
                Configuracion de cupo y reglas de reserva
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="max_capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidad maxima *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="20"
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 20)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="waitlist_enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Lista de espera</FormLabel>
                        <FormDescription className="text-xs">
                          Permitir reservas en espera
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

                {watchedWaitlistEnabled && (
                  <FormField
                    control={form.control}
                    name="max_waitlist"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max en lista de espera</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="5"
                            value={field.value}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="booking_opens_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apertura de reservas (horas)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="168"
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 168)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Horas antes de la clase
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="booking_closes_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cierre de reservas (min)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="60"
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 60)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Minutos antes de la clase
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cancellation_deadline_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite cancelacion (horas)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="2"
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 2)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Horas antes para cancelar
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/templates')}
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
                'Crear plantilla'
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
