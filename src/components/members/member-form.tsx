'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import type { Tables } from '@/types/database.types'
import { createMemberData, updateMemberData } from '@/actions/member.actions'
import { getActivePlans } from '@/actions/plan.actions'
import { memberSchema, type MemberFormData } from '@/schemas/member.schema'

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
// TYPES
// =============================================================================

interface MembershipPlan {
  id: string
  name: string
  price: number
  currency: string
  billing_period: string
  duration_days: number
}

interface MemberFormProps {
  member?: Tables<'members'>
  mode: 'create' | 'edit'
}

// =============================================================================
// HELPERS
// =============================================================================

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency,
  }).format(price)
}

function getBillingPeriodLabel(period: string): string {
  const labels: Record<string, string> = {
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    yearly: 'Anual',
    one_time: 'Pago único',
  }
  return labels[period] || period
}

function calculateEndDate(startDate: string, durationDays: number): string {
  const start = new Date(startDate)
  start.setDate(start.getDate() + durationDays)
  return start.toISOString().split('T')[0]
}

// =============================================================================
// COMPONENT
// =============================================================================

export function MemberForm({ member, mode }: MemberFormProps) {
  const router = useRouter()
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      email: member?.email ?? '',
      full_name: member?.full_name ?? '',
      phone: member?.phone ?? '',
      date_of_birth: member?.date_of_birth ?? '',
      gender: (member?.gender as MemberFormData['gender']) ?? undefined,
      emergency_contact_name: member?.emergency_contact_name ?? '',
      emergency_contact_phone: member?.emergency_contact_phone ?? '',
      medical_conditions: member?.medical_conditions ?? '',
      injuries: member?.injuries ?? '',
      experience_level: (member?.experience_level as MemberFormData['experience_level']) ?? 'beginner',
      status: (member?.status as MemberFormData['status']) ?? 'active',
      internal_notes: member?.internal_notes ?? '',
      current_plan_id: member?.current_plan_id ?? undefined,
      membership_start_date: member?.membership_start_date ?? '',
      membership_end_date: member?.membership_end_date ?? '',
    },
  })

  // Load active plans
  useEffect(() => {
    async function loadPlans() {
      setIsLoadingPlans(true)
      const { data } = await getActivePlans()
      if (data) {
        setPlans(data as MembershipPlan[])
      }
      setIsLoadingPlans(false)
    }
    loadPlans()
  }, [])

  // Watch plan selection to auto-calculate end date
  const selectedPlanId = form.watch('current_plan_id')
  const startDate = form.watch('membership_start_date')

  useEffect(() => {
    if (selectedPlanId && startDate) {
      const selectedPlan = plans.find(p => p.id === selectedPlanId)
      if (selectedPlan) {
        const endDate = calculateEndDate(startDate, selectedPlan.duration_days)
        form.setValue('membership_end_date', endDate)
      }
    }
  }, [selectedPlanId, startDate, plans, form])

  // Auto-set start date to today when selecting a plan
  useEffect(() => {
    if (selectedPlanId && !startDate) {
      const today = new Date().toISOString().split('T')[0]
      form.setValue('membership_start_date', today)
    }
  }, [selectedPlanId, startDate, form])

  const onSubmit = async (data: MemberFormData) => {
    try {
      const result = mode === 'create'
        ? await createMemberData(data)
        : await updateMemberData(member!.id, data)

      if (result.success) {
        toast.success(result.message)
        router.push('/dashboard/members')
      } else {
        toast.error(result.message)
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, errors]) => {
            form.setError(field as keyof MemberFormData, {
              message: errors[0],
            })
          })
        }
      }
    } catch {
      toast.error('Error al guardar el miembro')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Informacion Basica</TabsTrigger>
              <TabsTrigger value="membership">Membresia</TabsTrigger>
              <TabsTrigger value="contact">Contacto Emergencia</TabsTrigger>
              <TabsTrigger value="fitness">Fitness & Salud</TabsTrigger>
            </TabsList>

            {/* TAB 1: Basic Info */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Datos personales</CardTitle>
                  <CardDescription>
                    Informacion basica del miembro
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre completo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Juan Perez" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="juan@ejemplo.com"
                              {...field}
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
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefono</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="+52 55 1234 5678"
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
                      name="date_of_birth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de nacimiento</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value ?? ''}
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
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Genero</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value ?? undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar genero" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Masculino</SelectItem>
                              <SelectItem value="female">Femenino</SelectItem>
                              <SelectItem value="other">Otro</SelectItem>
                              <SelectItem value="prefer_not_to_say">Prefiero no decir</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar estado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Activo</SelectItem>
                              <SelectItem value="inactive">Inactivo</SelectItem>
                              <SelectItem value="suspended">Suspendido</SelectItem>
                              <SelectItem value="cancelled">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: Membership */}
            <TabsContent value="membership" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Plan de membresia</CardTitle>
                  <CardDescription>
                    Selecciona el plan y configura las fechas de la membresia
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="current_plan_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan de membresia *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? undefined}
                          disabled={isLoadingPlans}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isLoadingPlans ? 'Cargando planes...' : 'Selecciona un plan'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {plans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                <div className="flex flex-col">
                                  <span>{plan.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatPrice(plan.price, plan.currency)} - {getBillingPeriodLabel(plan.billing_period)}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Selecciona el plan de membresia para este miembro
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="membership_start_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de inicio</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Fecha en que inicia la membresia
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="membership_end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de vencimiento</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Se calcula automaticamente segun el plan
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {selectedPlanId && (
                    <div className="rounded-lg bg-muted/50 p-4">
                      <h4 className="font-medium text-sm mb-2">Resumen del plan seleccionado</h4>
                      {(() => {
                        const plan = plans.find(p => p.id === selectedPlanId)
                        if (!plan) return null
                        return (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Plan:</span>{' '}
                              <span className="font-medium">{plan.name}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Precio:</span>{' '}
                              <span className="font-medium">{formatPrice(plan.price, plan.currency)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Periodo:</span>{' '}
                              <span className="font-medium">{getBillingPeriodLabel(plan.billing_period)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Duracion:</span>{' '}
                              <span className="font-medium">{plan.duration_days} dias</span>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: Emergency Contact */}
            <TabsContent value="contact" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contacto de emergencia</CardTitle>
                  <CardDescription>
                    Persona a contactar en caso de emergencia
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="emergency_contact_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nombre del contacto"
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
                      name="emergency_contact_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefono</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="+52 55 1234 5678"
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
            </TabsContent>

            {/* TAB 4: Fitness & Health */}
            <TabsContent value="fitness" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informacion de fitness</CardTitle>
                  <CardDescription>
                    Nivel de experiencia y objetivos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="experience_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nivel de experiencia</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar nivel" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Principiante</SelectItem>
                            <SelectItem value="intermediate">Intermedio</SelectItem>
                            <SelectItem value="advanced">Avanzado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informacion medica</CardTitle>
                  <CardDescription>
                    Condiciones medicas y lesiones importantes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="medical_conditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condiciones medicas</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ej: Diabetes, hipertension, asma..."
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
                    name="injuries"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lesiones</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ej: Lesion de rodilla izquierda..."
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
                  <CardTitle>Notas internas</CardTitle>
                  <CardDescription>
                    Notas visibles solo para el staff
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="internal_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Notas adicionales sobre el miembro..."
                            rows={4}
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
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/members')}
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
                'Crear miembro'
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
