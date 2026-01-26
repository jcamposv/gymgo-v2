'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, CreditCard, Calendar, User, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

import { registerMembershipPayment, getMemberMembershipStatus, type MembershipStatus } from '@/actions/membership.actions'
import {
  membershipPaymentSchema,
  PAYMENT_PERIOD_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  MEMBERSHIP_STATUS_CONFIG,
  getPeriodMonths,
  formatCurrency,
  formatDate,
  type MembershipPaymentFormData,
  type PaymentPeriodType,
} from '@/schemas/membership.schema'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Separator } from '@/components/ui/separator'

interface Member {
  id: string
  full_name: string
  email: string
}

interface Plan {
  id: string
  name: string
  price: number
  duration_days: number
}

interface MembershipPaymentFormProps {
  members: Member[]
  plans: Plan[]
  currency: string
  preselectedMemberId?: string
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'active':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'expiring_soon':
      return <Clock className="h-4 w-4 text-yellow-600" />
    case 'expired':
      return <XCircle className="h-4 w-4 text-red-600" />
    default:
      return <AlertCircle className="h-4 w-4 text-gray-600" />
  }
}

export function MembershipPaymentForm({
  members,
  plans,
  currency,
  preselectedMemberId,
}: MembershipPaymentFormProps) {
  const router = useRouter()
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<MembershipPaymentFormData>({
    resolver: zodResolver(membershipPaymentSchema) as any,
    defaultValues: {
      member_id: preselectedMemberId || '',
      plan_id: null,
      amount: 0,
      currency: currency,
      payment_method: 'cash',
      period_type: 'monthly',
      period_months: 1,
      notes: '',
      reference_number: '',
    },
  })

  const selectedMemberId = form.watch('member_id')
  const selectedPlanId = form.watch('plan_id')
  const selectedPeriodType = form.watch('period_type')
  const periodMonths = form.watch('period_months')

  // Fetch membership status when member is selected
  useEffect(() => {
    if (selectedMemberId) {
      setLoadingStatus(true)
      getMemberMembershipStatus(selectedMemberId)
        .then((result) => {
          if (result.success && result.data) {
            setMembershipStatus(result.data)
          } else {
            setMembershipStatus(null)
          }
        })
        .catch(() => setMembershipStatus(null))
        .finally(() => setLoadingStatus(false))
    } else {
      setMembershipStatus(null)
    }
  }, [selectedMemberId])

  // Auto-fill amount when plan is selected
  const handlePlanChange = (planId: string) => {
    form.setValue('plan_id', planId || null)
    if (planId) {
      const plan = plans.find((p) => p.id === planId)
      if (plan) {
        const months = getPeriodMonths(selectedPeriodType as PaymentPeriodType, periodMonths)
        form.setValue('amount', plan.price * months)
      }
    }
  }

  // Update amount when period changes
  const handlePeriodChange = (periodType: PaymentPeriodType) => {
    form.setValue('period_type', periodType)
    const months = getPeriodMonths(periodType, periodMonths)
    form.setValue('period_months', months)

    // Recalculate amount if plan is selected
    if (selectedPlanId) {
      const plan = plans.find((p) => p.id === selectedPlanId)
      if (plan) {
        form.setValue('amount', plan.price * months)
      }
    }
  }

  // Update amount when custom months change
  const handleCustomMonthsChange = (months: number) => {
    form.setValue('period_months', months)
    if (selectedPlanId) {
      const plan = plans.find((p) => p.id === selectedPlanId)
      if (plan) {
        form.setValue('amount', plan.price * months)
      }
    }
  }

  const onSubmit = async (data: MembershipPaymentFormData) => {
    // Set period_months based on period_type if not custom
    const finalPeriodMonths = data.period_type === 'custom'
      ? data.period_months
      : getPeriodMonths(data.period_type as PaymentPeriodType)

    try {
      const result = await registerMembershipPayment({
        ...data,
        period_months: finalPeriodMonths,
      })

      if (result.success) {
        toast.success(result.message)
        router.push('/dashboard/finances/payments')
      } else {
        toast.error(result.message)
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, errors]) => {
            form.setError(field as keyof MembershipPaymentFormData, {
              message: Array.isArray(errors) ? errors[0] : String(errors),
            })
          })
        }
      }
    } catch {
      toast.error('Error al registrar el pago')
    }
  }

  const statusConfig = membershipStatus?.status
    ? MEMBERSHIP_STATUS_CONFIG[membershipStatus.status as keyof typeof MEMBERSHIP_STATUS_CONFIG]
    : null

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          {/* Member Selection & Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-lime-600" />
                Miembro
              </CardTitle>
              <CardDescription>
                Selecciona el miembro que realiza el pago
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

              {/* Membership Status Display */}
              {selectedMemberId && (
                <div className="p-4 rounded-lg border bg-muted/30">
                  {loadingStatus ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando estado...
                    </div>
                  ) : membershipStatus ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Estado de membresia</span>
                        {statusConfig && (
                          <Badge className={statusConfig.color}>
                            <StatusIcon status={membershipStatus.status} />
                            <span className="ml-1">{statusConfig.label}</span>
                          </Badge>
                        )}
                      </div>
                      {membershipStatus.end_date && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Vence:</span>
                          <span className={membershipStatus.status === 'expired' ? 'text-red-600' : ''}>
                            {formatDate(membershipStatus.end_date)}
                            {membershipStatus.days_remaining !== null && membershipStatus.days_remaining > 0 && (
                              <span className="text-muted-foreground ml-1">
                                ({membershipStatus.days_remaining} dias)
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {membershipStatus.plan_name && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Plan actual:</span>
                          <span>{membershipStatus.plan_name}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Sin informacion de membresia
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Period Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-lime-600" />
                Periodo de membresia
              </CardTitle>
              <CardDescription>
                Selecciona el periodo que cubre este pago
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="period_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duracion *</FormLabel>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {PAYMENT_PERIOD_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={field.value === option.value ? 'default' : 'outline'}
                          className={field.value === option.value ? 'bg-lime-600 hover:bg-lime-700' : ''}
                          onClick={() => handlePeriodChange(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedPeriodType === 'custom' && (
                <FormField
                  control={form.control}
                  name="period_months"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numero de meses *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={36}
                          {...field}
                          onChange={(e) => handleCustomMonthsChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription>Entre 1 y 36 meses</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="plan_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan de membresia</FormLabel>
                    <Select
                      onValueChange={handlePlanChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar plan (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - {formatCurrency(plan.price, currency)}/mes
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Opcional - ayuda a calcular el monto automaticamente
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-lime-600" />
                Detalles del pago
              </CardTitle>
              <CardDescription>
                Informacion del pago recibido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {currency}
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="pl-14"
                            {...field}
                          />
                        </div>
                      </FormControl>
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
                          {PAYMENT_METHOD_OPTIONS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
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
                name="reference_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numero de referencia</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: TRF-12345"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Opcional - numero de transferencia, voucher, etc.
                    </FormDescription>
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
                        placeholder="Notas adicionales sobre el pago..."
                        rows={3}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Summary & Actions */}
          <Card className="bg-muted/30">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Resumen del pago</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(form.watch('amount') || 0, currency)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getPeriodMonths(selectedPeriodType as PaymentPeriodType, periodMonths)} mes(es) de membresia
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={form.formState.isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="bg-lime-600 hover:bg-lime-700"
                  >
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
            </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  )
}
