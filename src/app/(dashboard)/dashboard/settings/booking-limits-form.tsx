'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Info } from 'lucide-react'
import { toast } from 'sonner'

import { updateBookingLimits } from '@/actions/organization.actions'
import {
  bookingLimitsSchema,
  type BookingLimitsFormData,
} from '@/schemas/booking-limits.schema'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

// =============================================================================
// TYPES
// =============================================================================

interface BookingLimitsFormProps {
  initialData: {
    max_classes_per_day: number | null
  }
  timezone?: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

const LIMIT_OPTIONS = [
  { value: 'unlimited', label: 'Ilimitado', description: 'Sin restriccion de clases por dia' },
  { value: '1', label: '1 clase por dia', description: 'Maximo 1 clase por miembro por dia' },
  { value: '2', label: '2 clases por dia', description: 'Maximo 2 clases por miembro por dia' },
  { value: '3', label: '3 clases por dia', description: 'Maximo 3 clases por miembro por dia' },
  { value: '4', label: '4 clases por dia', description: 'Maximo 4 clases por miembro por dia' },
  { value: '5', label: '5 clases por dia', description: 'Maximo 5 clases por miembro por dia' },
]

// =============================================================================
// COMPONENT
// =============================================================================

export function BookingLimitsForm({ initialData, timezone }: BookingLimitsFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<BookingLimitsFormData>({
    resolver: zodResolver(bookingLimitsSchema),
    defaultValues: {
      max_classes_per_day: initialData.max_classes_per_day,
    },
  })

  const currentValue = form.watch('max_classes_per_day')
  const selectValue = currentValue === null ? 'unlimited' : String(currentValue)

  function onSubmit(data: BookingLimitsFormData) {
    startTransition(async () => {
      const result = await updateBookingLimits(data)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="max_classes_per_day"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximo de clases por miembro por dia</FormLabel>
              <Select
                value={selectValue}
                onValueChange={(value) => {
                  field.onChange(value === 'unlimited' ? null : parseInt(value, 10))
                }}
                disabled={isPending}
              >
                <FormControl>
                  <SelectTrigger className="w-full sm:w-[280px]">
                    <SelectValue placeholder="Selecciona un limite" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LIMIT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Limita cuantas clases puede reservar un miembro en un mismo dia.
                Este limite aplica tanto a reservas confirmadas como a lista de espera.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {currentValue !== null && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Los miembros podran reservar hasta <strong>{currentValue} {currentValue === 1 ? 'clase' : 'clases'}</strong> por dia.
              {timezone && (
                <span className="block text-muted-foreground mt-1">
                  El dia se calcula segun la zona horaria: {timezone}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>

          {form.formState.isDirty && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => form.reset()}
              disabled={isPending}
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
