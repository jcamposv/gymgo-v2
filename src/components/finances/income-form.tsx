'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, MapPin } from 'lucide-react'

import { createIncome } from '@/actions/finance.actions'
import {
  incomeSchema,
  INCOME_CATEGORY_LABELS,
  type IncomeFormData,
  type IncomeCategory,
} from '@/schemas/finance.schema'
import { getCurrencySymbol } from '@/lib/utils'
import { useLocationContext } from '@/providers/location-provider'

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

interface IncomeFormProps {
  currency: string
}

export function IncomeForm({ currency }: IncomeFormProps) {
  const router = useRouter()
  const symbol = getCurrencySymbol(currency)
  const { activeLocationId, activeLocationName, isAllLocationsMode, hasMultipleLocations } = useLocationContext()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema) as any,
    defaultValues: {
      description: '',
      amount: 0,
      category: 'other',
      income_date: new Date(),
      notes: '',
      // Auto-assign from dashboard context (no selector)
      location_id: activeLocationId,
    },
  })

  const onSubmit = async (data: IncomeFormData) => {
    // Ensure location_id is set from context
    const submitData = {
      ...data,
      location_id: activeLocationId,
    }

    try {
      const result = await createIncome(submitData)

      if (result.success) {
        toast.success(result.message)
        router.push('/dashboard/finances/income')
      } else {
        toast.error(result.message)
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, errors]) => {
            form.setError(field as keyof IncomeFormData, {
              message: Array.isArray(errors) ? errors[0] : errors,
            })
          })
        }
      }
    } catch {
      toast.error('Error al registrar el ingreso')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          {/* Location Context Indicator (read-only) */}
          {hasMultipleLocations && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Se registrara en: {activeLocationName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Este ingreso se asociara a la sucursal actual del dashboard
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Informacion del ingreso</CardTitle>
              <CardDescription>
                Registra un nuevo ingreso adicional (productos, servicios, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripcion *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Venta de suplementos"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto ({currency}) *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground">
                            {symbol}
                          </span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="pl-8"
                            placeholder="0.00"
                            value={field.value}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(Object.entries(INCOME_CATEGORY_LABELS) as [IncomeCategory, string][]).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="income_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha del ingreso</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value instanceof Date
                          ? field.value.toISOString().split('T')[0]
                          : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas adicionales sobre el ingreso..."
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

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/finances/income')}
              disabled={form.formState.isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting || isAllLocationsMode}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrar ingreso'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
