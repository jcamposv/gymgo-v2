'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Copy, Plus } from 'lucide-react'
import { z } from 'zod'

import {
  createClassTemplateData,
  updateClassTemplateData,
  deleteClassTemplate,
} from '@/actions/template.actions'
import { daysOfWeek, classTypes, dayOfWeekLabels } from '@/schemas/template.schema'
import type { Tables } from '@/types/database.types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { InstructorSelect } from '@/components/shared/instructor-select'

type ClassTemplate = Tables<'class_templates'>

// Simplified schema for quick creation
const quickSlotSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  class_type: z.string().nullable(),
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  max_capacity: z.number().min(1),
  instructor_id: z.string().nullable(),
  instructor_name: z.string().nullable(),
  location: z.string().nullable(),
  waitlist_enabled: z.boolean(),
  max_waitlist: z.number().min(0),
  is_active: z.boolean(),
  // Default values for booking rules
  booking_opens_hours: z.number(),
  booking_closes_minutes: z.number(),
  cancellation_deadline_hours: z.number(),
})

type QuickSlotFormData = z.infer<typeof quickSlotSchema>

interface QuickSlotModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // For editing existing template
  template?: ClassTemplate | null
  // For creating new with defaults
  defaultDayOfWeek?: number
  defaultTime?: string
  // Callback after successful operation
  onSuccess?: () => void
}

export function QuickSlotModal({
  open,
  onOpenChange,
  template,
  defaultDayOfWeek = 1,
  defaultTime = '09:00',
  onSuccess,
}: QuickSlotModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDuplicateOptions, setShowDuplicateOptions] = useState(false)
  const [selectedDays, setSelectedDays] = useState<number[]>([])

  const isEditing = !!template

  const form = useForm<QuickSlotFormData>({
    resolver: zodResolver(quickSlotSchema),
    defaultValues: {
      name: '',
      class_type: null,
      day_of_week: defaultDayOfWeek,
      start_time: defaultTime,
      end_time: calculateEndTime(defaultTime),
      max_capacity: 20,
      instructor_id: null,
      instructor_name: null,
      location: null,
      waitlist_enabled: true,
      max_waitlist: 5,
      is_active: true,
      booking_opens_hours: 168,
      booking_closes_minutes: 60,
      cancellation_deadline_hours: 2,
    },
  })

  // Reset form when template changes
  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        class_type: template.class_type,
        day_of_week: template.day_of_week,
        start_time: template.start_time.slice(0, 5),
        end_time: template.end_time.slice(0, 5),
        max_capacity: template.max_capacity,
        instructor_id: template.instructor_id,
        instructor_name: template.instructor_name,
        location: template.location,
        waitlist_enabled: template.waitlist_enabled,
        max_waitlist: template.max_waitlist,
        is_active: template.is_active,
        booking_opens_hours: template.booking_opens_hours,
        booking_closes_minutes: template.booking_closes_minutes,
        cancellation_deadline_hours: template.cancellation_deadline_hours,
      })
    } else {
      form.reset({
        name: '',
        class_type: null,
        day_of_week: defaultDayOfWeek,
        start_time: defaultTime,
        end_time: calculateEndTime(defaultTime),
        max_capacity: 20,
        instructor_id: null,
        instructor_name: null,
        location: null,
        waitlist_enabled: true,
        max_waitlist: 5,
        is_active: true,
        booking_opens_hours: 168,
        booking_closes_minutes: 60,
        cancellation_deadline_hours: 2,
      })
    }
    setShowDuplicateOptions(false)
    setSelectedDays([])
  }, [template, defaultDayOfWeek, defaultTime, form])

  const onSubmit = async (data: QuickSlotFormData) => {
    try {
      if (isEditing) {
        const result = await updateClassTemplateData(template.id, data)
        if (result.success) {
          toast.success('Plantilla actualizada')
          onOpenChange(false)
          onSuccess?.()
        } else {
          toast.error(result.message)
        }
      } else {
        // Create for current day
        const result = await createClassTemplateData(data)
        if (!result.success) {
          toast.error(result.message)
          return
        }

        // If duplicating to other days
        if (selectedDays.length > 0) {
          let successCount = 1
          for (const day of selectedDays) {
            const duplicateResult = await createClassTemplateData({
              ...data,
              day_of_week: day,
            })
            if (duplicateResult.success) successCount++
          }
          toast.success(`${successCount} plantillas creadas`)
        } else {
          toast.success('Plantilla creada')
        }

        onOpenChange(false)
        onSuccess?.()
      }
    } catch {
      toast.error('Error al guardar')
    }
  }

  const handleDelete = async () => {
    if (!template) return

    setIsDeleting(true)
    const result = await deleteClassTemplate(template.id)
    setIsDeleting(false)

    if (result.success) {
      toast.success('Plantilla eliminada')
      onOpenChange(false)
      onSuccess?.()
    } else {
      toast.error(result.message)
    }
  }

  const toggleDay = (day: number) => {
    const currentDay = form.getValues('day_of_week')
    if (day === currentDay) return // Can't unselect primary day

    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar clase' : 'Nueva clase'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Editando ${template.name} - ${dayOfWeekLabels[template.day_of_week]}`
              : 'Agrega una clase al horario semanal'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name & Type - Row 1 */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="CrossFit WOD" {...field} />
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
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
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
            </div>

            {/* Day & Time - Row 2 */}
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="day_of_week"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia *</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(Number(v))}
                      value={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inicio *</FormLabel>
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
                    <FormLabel>Fin *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Instructor & Location - Row 3 */}
            <div className="grid grid-cols-2 gap-3">
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
                          form.setValue('instructor_name', instructorName)
                        }}
                        placeholder="Seleccionar..."
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
                        placeholder="Sala principal"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Capacity & Waitlist - Row 4 */}
            <div className="grid grid-cols-3 gap-3 items-end">
              <FormField
                control={form.control}
                name="max_capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidad</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
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
                name="waitlist_enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0 pt-6">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Lista espera</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0 pt-6">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Activa</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {/* Duplicate to other days (only for new) */}
            {!isEditing && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDuplicateOptions(!showDuplicateOptions)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicar a otros dias
                  </Button>

                  {showDuplicateOptions && (
                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/50">
                      {daysOfWeek.map((day) => {
                        const isCurrentDay = day.value === form.watch('day_of_week')
                        const isSelected = selectedDays.includes(day.value)
                        return (
                          <Badge
                            key={day.value}
                            variant={isCurrentDay ? 'default' : isSelected ? 'secondary' : 'outline'}
                            className={`cursor-pointer ${
                              isCurrentDay ? 'cursor-not-allowed' : 'hover:bg-secondary'
                            }`}
                            onClick={() => toggleDay(day.value)}
                          >
                            {day.label.slice(0, 3)}
                            {isCurrentDay && ' (actual)'}
                          </Badge>
                        )
                      })}
                      {selectedDays.length > 0 && (
                        <span className="text-xs text-muted-foreground ml-2 self-center">
                          +{selectedDays.length} dias
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            <DialogFooter className="gap-2">
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting || form.formState.isSubmitting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Eliminar'
                  )}
                </Button>
              )}
              <div className="flex-1" />
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : isEditing ? (
                  'Guardar'
                ) : selectedDays.length > 0 ? (
                  `Crear ${1 + selectedDays.length} clases`
                ) : (
                  'Crear clase'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// Helper to calculate end time (1 hour after start)
function calculateEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const endHours = (hours + 1) % 24
  return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}
