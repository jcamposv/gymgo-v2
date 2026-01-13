'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { createPayment } from '@/actions/finance.actions'
import {
  paymentSchema,
  PAYMENT_METHOD_LABELS,
  type PaymentFormData,
  type PaymentMethod,
} from '@/schemas/finance.schema'
import { formatCurrency, getCurrencySymbol } from '@/lib/utils'

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

interface Member {
  id: string
  full_name: string
  email: string
}

interface Plan {
  id: string
  name: string
  price: number
}

interface PaymentFormProps {
  members: Member[]
  plans: Plan[]
  currency: string
}

export function PaymentForm({ members, plans, currency }: PaymentFormProps) {
  const router = useRouter()
  const symbol = getCurrencySymbol(currency)

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      member_id: '',
      plan_id: null,
      amount: 0,
      payment_method: 'cash',
      payment_date: new Date(),
      notes: '',
      reference_number: '',
    },
  })

  const selectedPlanId = form.watch('plan_id')

  // Auto-fill amount when plan is selected
  const handlePlanChange = (planId: string) => {
    form.setValue('plan_id', planId || null)
    if (planId) {
      const plan = plans.find(p => p.id === planId)
      if (plan) {
        form.setValue('amount', plan.price)
      }
    }
  }

  const onSubmit = async (data: PaymentFormData) => {
    try {
      const result = await createPayment(data)

      if (result.success) {
        toast.success(result.message)
        router.push('/dashboard/finances/payments')
      } else {
        toast.error(result.message)
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, errors]) => {
            form.setError(field as keyof PaymentFormData, {
              message: Array.isArray(errors) ? errors[0] : errors,
            })
          })
        }
      }
    } catch {
      toast.error('Error al registrar el pago')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informacion del pago</CardTitle>
              <CardDescription>
                Registra un nuevo pago de membresia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="member_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Miembro *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar miembro" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.full_name} ({member.email})
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
                name="plan_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan de membresia</FormLabel>
                    <Select
                      onValueChange={handlePlanChange}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar plan (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - {formatCurrency(plan.price, { currency })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Al seleccionar un plan, se actualizara la membresia del miembro
                    </FormDescription>
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
                      {selectedPlanId && (
                        <FormDescription>
                          Monto sugerido del plan seleccionado
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metodo de pago *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar metodo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(
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

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="payment_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha del pago</FormLabel>
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
                  name="reference_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numero de referencia</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: TXN-12345"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Numero de transaccion o recibo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas adicionales sobre el pago..."
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
              onClick={() => router.push('/dashboard/finances/payments')}
              disabled={form.formState.isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrar pago'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
