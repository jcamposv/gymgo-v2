'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Loader2,
  Mail,
  Shield,
  Check,
  X,
  UserCheck,
  Clock,
  Send,
  AlertCircle,
} from 'lucide-react'

import type { Tables } from '@/types/database.types'
import type { AppRole } from '@/lib/rbac'
import { createMemberData, updateMemberData } from '@/actions/member.actions'
import { getActivePlans } from '@/actions/plan.actions'
import { sendMemberInvitation } from '@/actions/invitation.actions'
import { updateMemberProfileRole, type MemberAccountStatus } from '@/actions/user.actions'
import {
  memberFormSchema,
  type MemberFormValues,
  type MemberFormData,
  getTabsWithErrors,
  getFirstTabWithError,
} from '@/schemas/member.schema'
import { ROLE_LABELS, ROLE_COLORS, ASSIGNABLE_ROLES } from '@/lib/rbac/role-labels'

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
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { usePlanLimit, isPlanLimitError } from '@/hooks/use-plan-limit'
import { PlanLimitDialog } from '@/components/shared/plan-limit-dialog'

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
  accountStatus?: MemberAccountStatus | null
  profileRole?: AppRole | null
  canEditRole?: boolean
}

type TabName = 'basic' | 'membership' | 'contact' | 'fitness'

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
    one_time: 'Pago unico',
  }
  return labels[period] || period
}

function calculateEndDate(startDate: string, durationDays: number): string {
  const start = new Date(startDate)
  start.setDate(start.getDate() + durationDays)
  return start.toISOString().split('T')[0]
}

// =============================================================================
// TAB TRIGGER WITH ERROR INDICATOR
// =============================================================================

interface TabTriggerWithErrorProps {
  value: TabName
  label: string
  hasError: boolean
}

function TabTriggerWithError({ value, label, hasError }: TabTriggerWithErrorProps) {
  return (
    <TabsTrigger value={value} className="relative">
      {label}
      {hasError && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
      )}
    </TabsTrigger>
  )
}

// =============================================================================
// COMPONENT
// =============================================================================

export function MemberForm({ member, mode, accountStatus, profileRole, canEditRole }: MemberFormProps) {
  const router = useRouter()
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)
  const [activeTab, setActiveTab] = useState<TabName>('basic')
  const [tabsWithErrors, setTabsWithErrors] = useState<TabName[]>([])

  // Role management state (for edit mode only)
  const [selectedRole, setSelectedRole] = useState<AppRole>(profileRole ?? 'client')
  const [isRolePending, startRoleTransition] = useTransition()
  const [roleFeedback, setRoleFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Plan limit error handling
  const {
    showLimitDialog,
    limitErrorData,
    handleResult: handlePlanLimitResult,
    clearLimitError,
  } = usePlanLimit()

  // Get today's date for default start date
  const today = new Date().toISOString().split('T')[0]

  // Form setup with unified schema
  const form = useForm({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      email: member?.email ?? '',
      full_name: member?.full_name ?? '',
      phone: member?.phone ?? '',
      date_of_birth: member?.date_of_birth ?? '',
      gender: (member?.gender as MemberFormValues['gender']) ?? undefined,
      emergency_contact_name: member?.emergency_contact_name ?? '',
      emergency_contact_phone: member?.emergency_contact_phone ?? '',
      medical_conditions: member?.medical_conditions ?? '',
      injuries: member?.injuries ?? '',
      experience_level: (member?.experience_level as MemberFormValues['experience_level']) ?? 'beginner',
      status: (member?.status as MemberFormValues['status']) ?? 'active',
      internal_notes: member?.internal_notes ?? '',
      current_plan_id: member?.current_plan_id ?? '',
      membership_start_date: member?.membership_start_date ?? today,
      membership_end_date: member?.membership_end_date ?? '',
      // Invitation fields (only used in create mode)
      send_invitation: true,
      role: 'client' as const,
    },
    mode: 'onBlur', // Validate on blur for better UX
  })

  const { formState: { errors } } = form

  // Update tabs with errors when form errors change
  useEffect(() => {
    const errorTabs = getTabsWithErrors(errors as Record<string, unknown>)
    setTabsWithErrors(errorTabs)
  }, [errors])

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
  const sendInvitation = form.watch('send_invitation')

  useEffect(() => {
    if (selectedPlanId && startDate) {
      const selectedPlan = plans.find(p => p.id === selectedPlanId)
      if (selectedPlan) {
        const endDate = calculateEndDate(startDate, selectedPlan.duration_days)
        form.setValue('membership_end_date', endDate)
      }
    }
  }, [selectedPlanId, startDate, plans, form])

  // Handle role change (edit mode only)
  const handleRoleChange = (newRole: AppRole) => {
    if (!member || newRole === selectedRole) return

    startRoleTransition(async () => {
      const result = await updateMemberProfileRole(member.id, newRole)

      // Check for plan limit errors first - show dialog for blocking actions
      if (isPlanLimitError(result)) {
        handlePlanLimitResult(result, { useDialog: true })
        setRoleFeedback({ type: 'error', message: 'Límite alcanzado' })
        setTimeout(() => setRoleFeedback(null), 3000)
        return
      }

      if (result.success) {
        setSelectedRole(newRole)
        setRoleFeedback({ type: 'success', message: 'Rol actualizado' })
      } else {
        setRoleFeedback({ type: 'error', message: result.message })
      }

      setTimeout(() => setRoleFeedback(null), 3000)
    })
  }

  // Form submission
  const onSubmit = async (data: MemberFormValues) => {
    try {
      // Extract invitation fields for create mode
      const { send_invitation, role, ...memberData } = data

      const result = mode === 'create'
        ? await createMemberData(memberData as MemberFormData)
        : await updateMemberData(member!.id, memberData as MemberFormData)

      // Check for plan limit errors - show dialog for blocking member creation
      if (isPlanLimitError(result)) {
        handlePlanLimitResult(result, { useDialog: true })
        return
      }

      if (result.success) {
        // If creating and invitation toggle is on, send invitation with role
        if (mode === 'create' && send_invitation && result.data) {
          const memberId = (result.data as { id: string }).id
          const inviteResult = await sendMemberInvitation(memberId, role)

          // Check for plan limit errors on invitation (e.g., role limit)
          if (isPlanLimitError(inviteResult)) {
            toast.success('Miembro creado')
            handlePlanLimitResult(inviteResult, { useDialog: true })
            router.push('/dashboard/members')
            return
          }

          if (inviteResult.success) {
            toast.success('Miembro creado e invitacion enviada correctamente')
          } else {
            toast.success('Miembro creado')
            toast.error(`Error al enviar invitacion: ${inviteResult.message}`)
          }
        } else {
          toast.success(result.message)
        }
        router.push('/dashboard/members')
      } else {
        toast.error(result.message)
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, fieldErrors]) => {
            form.setError(field as keyof MemberFormValues, {
              message: fieldErrors[0],
            })
          })
        }
      }
    } catch {
      toast.error('Error al guardar el miembro')
    }
  }

  // Handle form submission with validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Trigger validation on all fields
    const isValid = await form.trigger()

    if (!isValid) {
      // Find first tab with error and switch to it
      const firstErrorTab = getFirstTabWithError(form.formState.errors as Record<string, unknown>)
      if (firstErrorTab) {
        setActiveTab(firstErrorTab)
        toast.error('Por favor corrige los errores antes de continuar', {
          description: 'Hay campos obligatorios sin completar',
          icon: <AlertCircle className="h-4 w-4" />,
        })
      }
      return
    }

    // If valid, submit
    form.handleSubmit(onSubmit)()
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabName)} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabTriggerWithError
                value="basic"
                label="Informacion Basica"
                hasError={tabsWithErrors.includes('basic')}
              />
              <TabTriggerWithError
                value="membership"
                label="Membresia"
                hasError={tabsWithErrors.includes('membership')}
              />
              <TabTriggerWithError
                value="contact"
                label="Contacto Emergencia"
                hasError={tabsWithErrors.includes('contact')}
              />
              <TabTriggerWithError
                value="fitness"
                label="Fitness & Salud"
                hasError={tabsWithErrors.includes('fitness')}
              />
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
                          <FormLabel>Correo electronico *</FormLabel>
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
                            <SelectTrigger className={cn(
                              errors.current_plan_id && 'border-red-500 focus:ring-red-500'
                            )}>
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
                          <FormLabel>Fecha de inicio *</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value ?? ''}
                              className={cn(
                                errors.membership_start_date && 'border-red-500 focus:ring-red-500'
                              )}
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

          {/* Invitation Section - Only for create mode, INSIDE the form */}
          {mode === 'create' && (
            <Card className="border-lime-200 bg-lime-50/50">
              <CardContent className="space-y-4 py-4">
                {/* Send Invitation Toggle - Controlled by RHF */}
                <FormField
                  control={form.control}
                  name="send_invitation"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-100">
                          <Mail className="h-5 w-5 text-lime-700" />
                        </div>
                        <div>
                          <FormLabel className="font-medium cursor-pointer">
                            Enviar invitacion por correo
                          </FormLabel>
                          <FormDescription className="text-sm">
                            El miembro recibira un correo para crear su contrasena y acceder al sistema
                          </FormDescription>
                        </div>
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

                {/* Role Selector - Controlled by RHF, shown when invitation is enabled */}
                {sendInvitation && (
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between pt-4 border-t space-y-0">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-100">
                            <Shield className="h-5 w-5 text-lime-700" />
                          </div>
                          <div>
                            <FormLabel className="font-medium">
                              Rol en el sistema
                            </FormLabel>
                            <FormDescription className="text-sm">
                              Permisos que tendra el usuario cuando acepte la invitacion
                            </FormDescription>
                          </div>
                        </div>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue>
                                <Badge
                                  variant="outline"
                                  className={ROLE_COLORS[field.value as AppRole]}
                                >
                                  {ROLE_LABELS[field.value as AppRole]}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {ASSIGNABLE_ROLES.map((role) => (
                                <SelectItem key={role} value={role}>
                                  <span className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className={ROLE_COLORS[role]}
                                    >
                                      {ROLE_LABELS[role]}
                                    </Badge>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Role Selector - Only show in edit mode */}
          {mode === 'edit' && accountStatus !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-lime-600" />
                  Acceso al Sistema
                </CardTitle>
                <CardDescription>
                  Rol y permisos del usuario en la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Case 1: Member has an active user account */}
                {accountStatus?.hasAccount ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Rol actual</label>
                        <p className="text-sm text-muted-foreground mt-1">
                          El rol determina que acciones puede realizar el usuario
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {canEditRole && selectedRole !== 'super_admin' ? (
                          <>
                            <div className="relative">
                              {isRolePending && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-md z-10">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              )}
                              <Select
                                value={selectedRole ?? undefined}
                                onValueChange={(value) => handleRoleChange(value as AppRole)}
                                disabled={isRolePending}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue>
                                    {selectedRole && (
                                      <Badge
                                        variant="outline"
                                        className={ROLE_COLORS[selectedRole]}
                                      >
                                        {ROLE_LABELS[selectedRole]}
                                      </Badge>
                                    )}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {ASSIGNABLE_ROLES.map((role) => (
                                    <SelectItem key={role} value={role}>
                                      <span className="flex items-center gap-2">
                                        <Badge
                                          variant="outline"
                                          className={ROLE_COLORS[role]}
                                        >
                                          {ROLE_LABELS[role]}
                                        </Badge>
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {roleFeedback && (
                              <span className={`text-xs flex items-center gap-1 ${
                                roleFeedback.type === 'success' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {roleFeedback.type === 'success' ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
                                {roleFeedback.message}
                              </span>
                            )}
                          </>
                        ) : (
                          <Badge
                            variant="outline"
                            className={selectedRole ? ROLE_COLORS[selectedRole] : ''}
                          >
                            {selectedRole ? ROLE_LABELS[selectedRole] : 'Sin rol'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Show account email */}
                    {accountStatus.email && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-800">
                          Cuenta activa: <strong>{accountStatus.email}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                ) : accountStatus?.invitationSentAt ? (
                  /* Case 2: Invitation was sent but not yet accepted */
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-amber-800">Invitacion pendiente</p>
                      <p className="text-sm text-amber-700">
                        Se envio una invitacion el {new Date(accountStatus.invitationSentAt).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}. El miembro aun no ha aceptado.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-amber-300 text-amber-700 hover:bg-amber-100"
                      onClick={async () => {
                        if (!member) return
                        const result = await sendMemberInvitation(member.id, selectedRole)
                        if (result.success) {
                          toast.success('Invitacion reenviada')
                        } else {
                          toast.error(result.message)
                        }
                      }}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Reenviar
                    </Button>
                  </div>
                ) : (
                  /* Case 3: No account and no invitation sent */
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-muted-foreground">Sin cuenta de usuario</p>
                      <p className="text-sm text-muted-foreground">
                        Este miembro aun no tiene cuenta. Envia una invitacion para que pueda acceder al sistema.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!member) return
                        const result = await sendMemberInvitation(member.id, selectedRole)
                        if (result.success) {
                          toast.success('Invitacion enviada')
                          router.refresh()
                        } else {
                          toast.error(result.message)
                        }
                      }}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Enviar invitacion
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submit Buttons */}
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
                sendInvitation ? 'Crear y enviar invitacion' : 'Crear miembro'
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </div>
        </div>
      </form>
      {/* Plan Limit Dialog - shown when limit exceeded */}
      <PlanLimitDialog
        open={showLimitDialog}
        onOpenChange={clearLimitError}
        data={limitErrorData}
      />
    </Form>
  )
}
