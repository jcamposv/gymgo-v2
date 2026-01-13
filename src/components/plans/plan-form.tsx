'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Plus, X } from 'lucide-react'
import { useState } from 'react'

import { createPlanData, updatePlanData } from '@/actions/plan.actions'
import { planSchema, billingPeriodLabels, type PlanFormData } from '@/schemas/plan.schema'
import { CURRENCIES } from '@/lib/constants/currencies'

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
import { Badge } from '@/components/ui/badge'

interface Plan {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  billing_period: string
  unlimited_access: boolean
  classes_per_period: number | null
  access_all_locations: boolean
  duration_days: number
  features: string[]
  is_active: boolean
  is_featured: boolean
  sort_order: number
}

interface PlanFormProps {
  plan?: Plan
  mode: 'create' | 'edit'
  currency?: string
}

export function PlanForm({ plan, mode, currency = 'MXN' }: PlanFormProps) {
  const router = useRouter()
  const [newFeature, setNewFeature] = useState('')

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: plan?.name ?? '',
      description: plan?.description ?? '',
      price: plan?.price ?? 0,
      currency: plan?.currency ?? currency,
      billing_period: (plan?.billing_period as PlanFormData['billing_period']) ?? 'monthly',
      unlimited_access: plan?.unlimited_access ?? true,
      classes_per_period: plan?.classes_per_period ?? null,
      access_all_locations: plan?.access_all_locations ?? true,
      duration_days: plan?.duration_days ?? 30,
      features: plan?.features ?? [],
      is_active: plan?.is_active ?? true,
      is_featured: plan?.is_featured ?? false,
      sort_order: plan?.sort_order ?? 0,
    },
  })

  const watchedFeatures = form.watch('features')
  const watchedUnlimitedAccess = form.watch('unlimited_access')

  const addFeature = () => {
    if (newFeature.trim()) {
      const currentFeatures = form.getValues('features') || []
      if (!currentFeatures.includes(newFeature.trim())) {
        form.setValue('features', [...currentFeatures, newFeature.trim()])
      }
      setNewFeature('')
    }
  }

  const removeFeature = (index: number) => {
    const currentFeatures = form.getValues('features') || []
    form.setValue('features', currentFeatures.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: PlanFormData) => {
    try {
      const result = mode === 'create'
        ? await createPlanData(data)
        : await updatePlanData(plan!.id, data)

      if (result.success) {
        toast.success(result.message)
        router.push('/dashboard/plans')
      } else {
        toast.error(result.message)
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, errors]) => {
            form.setError(field as keyof PlanFormData, {
              message: errors[0],
            })
          })
        }
      }
    } catch {
      toast.error('Error al guardar el plan')
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
                  Nombre y descripcion del plan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del plan *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Plan Mensual Basico" {...field} />
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
                          placeholder="Descripcion del plan..."
                          rows={3}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 grid-cols-2">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Activo</FormLabel>
                          <FormDescription className="text-xs">
                            Visible para venta
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
                    name="is_featured"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Destacado</FormLabel>
                          <FormDescription className="text-xs">
                            Mostrar como recomendado
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Precio y facturacion</CardTitle>
                <CardDescription>
                  Configuracion de cobro
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 grid-cols-2">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={field.value}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Moneda</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCIES.map((currency) => (
                              <SelectItem key={currency.code} value={currency.code}>
                                {currency.symbol} {currency.code} - {currency.name}
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
                  name="billing_period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Periodo de facturacion</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(billingPeriodLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
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
                  name="duration_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duracion (dias)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="30"
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                        />
                      </FormControl>
                      <FormDescription>
                        Duracion de la membresia en dias
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sort_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orden de visualizacion</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Los planes se ordenan de menor a mayor
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Acceso y beneficios</CardTitle>
              <CardDescription>
                Que incluye este plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="unlimited_access"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Acceso ilimitado</FormLabel>
                        <FormDescription className="text-xs">
                          Sin limite de clases
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
                  name="access_all_locations"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Todas las ubicaciones</FormLabel>
                        <FormDescription className="text-xs">
                          Acceso a todas las sedes
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

                {!watchedUnlimitedAccess && (
                  <FormField
                    control={form.control}
                    name="classes_per_period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clases por periodo</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="10"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="space-y-3">
                <FormLabel>Beneficios incluidos</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Agregar beneficio..."
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addFeature()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addFeature}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {watchedFeatures?.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {feature}
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {(!watchedFeatures || watchedFeatures.length === 0) && (
                    <p className="text-sm text-muted-foreground">
                      No hay beneficios agregados
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/plans')}
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
                'Crear plan'
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
