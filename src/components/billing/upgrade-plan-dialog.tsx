'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Loader2, Sparkles, Check } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

import { createUpgradeRequest, getLatestUpgradeRequest } from '@/actions/upgrade-request.actions'
import {
  upgradeRequestSchema,
  type UpgradeRequestFormValues,
  type UpgradeRequest,
} from '@/schemas/upgrade-request.schema'
import { PRICING_PLANS, type PlanTier } from '@/lib/pricing.config'

// =============================================================================
// TYPES
// =============================================================================

interface UpgradePlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlan?: PlanTier
  userEmail?: string
  userName?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export function UpgradePlanDialog({
  open,
  onOpenChange,
  currentPlan = 'free',
  userEmail = '',
  userName = '',
}: UpgradePlanDialogProps) {
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [existingRequest, setExistingRequest] = useState<UpgradeRequest | null>(null)
  const [loadingRequest, setLoadingRequest] = useState(false)

  // Get available upgrade plans (plans higher than current)
  const planOrder: PlanTier[] = ['free', 'starter', 'growth', 'pro', 'enterprise']
  const currentPlanIndex = planOrder.indexOf(currentPlan)
  const availablePlans = PRICING_PLANS.filter((plan) => {
    const planIndex = planOrder.indexOf(plan.id)
    return planIndex > currentPlanIndex
  })

  const form = useForm<UpgradeRequestFormValues>({
    resolver: zodResolver(upgradeRequestSchema),
    defaultValues: {
      requestedPlan: availablePlans[0]?.id || 'pro',
      seats: undefined,
      message: '',
      contactEmail: userEmail,
      contactName: userName,
    },
  })

  // Fetch existing request when dialog opens
  useEffect(() => {
    if (open) {
      setLoadingRequest(true)
      getLatestUpgradeRequest()
        .then((result) => {
          if (result.success && result.data) {
            setExistingRequest(result.data)
          } else {
            setExistingRequest(null)
          }
        })
        .finally(() => setLoadingRequest(false))
    }
  }, [open])

  // Update form when userEmail/userName changes
  useEffect(() => {
    if (userEmail) form.setValue('contactEmail', userEmail)
    if (userName) form.setValue('contactName', userName)
  }, [userEmail, userName, form])

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSubmitError(null)
      form.reset()
    }
    onOpenChange(isOpen)
  }

  const handleSubmit = async (data: UpgradeRequestFormValues) => {
    setLoading(true)
    setSubmitError(null)

    try {
      const result = await createUpgradeRequest(data)

      if (result.success) {
        toast.success('Solicitud enviada', {
          description: 'Te contactaremos pronto para activar tu nuevo plan.',
        })
        // Refresh existing request state
        setExistingRequest({
          id: result.data?.id || '',
          status: result.data?.status || 'pending',
          requested_plan: data.requestedPlan,
          contact_email: data.contactEmail,
          contact_name: data.contactName || null,
          message: data.message || null,
          seats: data.seats || null,
          current_plan: currentPlan,
          organization_id: '',
          user_id: '',
          admin_notes: null,
          processed_at: null,
          processed_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        form.reset()
      } else {
        setSubmitError(result.message || 'Error al enviar la solicitud')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar la solicitud'
      setSubmitError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const currentPlanInfo = PRICING_PLANS.find((p) => p.id === currentPlan)
  const hasPendingRequest = existingRequest?.status === 'pending'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Mejorar tu plan
          </DialogTitle>
          <DialogDescription>
            Envia una solicitud y te contactaremos para activar tu nuevo plan.
          </DialogDescription>
        </DialogHeader>

        {loadingRequest ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : hasPendingRequest ? (
          // Show pending request status
          <div className="space-y-4">
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                Ya tienes una solicitud pendiente para el plan{' '}
                <strong>
                  {PRICING_PLANS.find((p) => p.id === existingRequest.requested_plan)?.name ||
                    existingRequest.requested_plan}
                </strong>
                .
              </AlertDescription>
            </Alert>

            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Pendiente de aprobacion
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan solicitado</span>
                <span className="text-sm font-medium">
                  {PRICING_PLANS.find((p) => p.id === existingRequest.requested_plan)?.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fecha</span>
                <span className="text-sm">
                  {new Date(existingRequest.created_at).toLocaleDateString('es-MX')}
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Te contactaremos pronto a <strong>{existingRequest.contact_email}</strong>
            </p>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOpenChange(false)}
            >
              Cerrar
            </Button>
          </div>
        ) : (
          // Show form
          <>
            {/* Current plan info */}
            <div className="rounded-lg border p-3 bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan actual</span>
                <Badge variant="outline">{currentPlanInfo?.name || 'Gratis'}</Badge>
              </div>
            </div>

            {/* Error Alert */}
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {/* Plan Selection */}
                <FormField
                  control={form.control}
                  name="requestedPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan deseado</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availablePlans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              <span className="flex items-center gap-2">
                                {plan.name}
                                {plan.priceMonthlyUSD > 0 && (
                                  <span className="text-muted-foreground">
                                    ${plan.priceMonthlyUSD}/mes
                                  </span>
                                )}
                                {plan.id === 'enterprise' && (
                                  <span className="text-muted-foreground">Contactar</span>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Seats/Members (optional) */}
                <FormField
                  control={form.control}
                  name="seats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numero de miembros (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="ej. 100"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseInt(e.target.value) : null)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Indica cuantos miembros planeas tener
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Contact Name */}
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de contacto</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Contact Email */}
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de contacto</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="tu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Message */}
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensaje (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Cuentanos mas sobre tus necesidades..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Enviando...' : 'Solicitar upgrade'}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
