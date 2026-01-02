'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building2,
  MapPin,
  Palette,
  Dumbbell,
  Flame,
  Heart,
  Timer,
  Sword,
  Bike,
  User,
  Sparkles,
  Layers,
} from 'lucide-react'

import { completeOnboarding, checkSlugAvailability } from '@/actions/onboarding.actions'
import {
  onboardingSchema,
  type OnboardingData,
  BUSINESS_TYPE_OPTIONS,
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
} from '@/schemas/onboarding.schema'
import type { BusinessType } from '@/types/database.types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

const STEPS = [
  { id: 1, title: 'Tu Negocio', description: 'Informacion basica' },
  { id: 2, title: 'Tipo de Negocio', description: 'Que ofreces' },
  { id: 3, title: 'Ubicacion', description: 'Pais y moneda' },
  { id: 4, title: 'Personalizacion', description: 'Colores de marca' },
]

const ICON_MAP: Record<string, React.ReactNode> = {
  dumbbell: <Dumbbell className="h-5 w-5" />,
  flame: <Flame className="h-5 w-5" />,
  heart: <Heart className="h-5 w-5" />,
  timer: <Timer className="h-5 w-5" />,
  sword: <Sword className="h-5 w-5" />,
  bike: <Bike className="h-5 w-5" />,
  user: <User className="h-5 w-5" />,
  sparkles: <Sparkles className="h-5 w-5" />,
  layers: <Layers className="h-5 w-5" />,
}

export function OnboardingWizard() {
  const [step, setStep] = useState(1)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const router = useRouter()

  const form = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: '',
      slug: '',
      business_type: undefined,
      country: 'MX',
      currency: 'MXN',
      timezone: 'America/Mexico_City',
      language: 'es',
      primary_color: '#000000',
      secondary_color: '#ffffff',
    },
    mode: 'onChange',
  })

  const progress = (step / STEPS.length) * 100

  // Watch form values for reactive button state
  const watchedName = form.watch('name')
  const watchedSlug = form.watch('slug')
  const watchedBusinessType = form.watch('business_type')
  const watchedCountry = form.watch('country')
  const watchedCurrency = form.watch('currency')

  const handleSlugChange = async (value: string) => {
    const slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
    form.setValue('slug', slug)
    setSlugAvailable(null)

    if (slug.length >= 3) {
      setIsCheckingSlug(true)
      const { available, error } = await checkSlugAvailability(slug)
      setIsCheckingSlug(false)
      setSlugAvailable(available && !error)
    }
  }

  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRY_OPTIONS.find((c) => c.value === countryCode)
    if (country) {
      form.setValue('country', countryCode)
      form.setValue('currency', country.currency)
      form.setValue('timezone', country.timezone)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return watchedName.length >= 2 && watchedSlug.length >= 3 && slugAvailable === true
      case 2:
        return !!watchedBusinessType
      case 3:
        return !!watchedCountry && !!watchedCurrency
      case 4:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (step < STEPS.length) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const onSubmit = async (data: OnboardingData) => {
    const result = await completeOnboarding(data)

    if (result.success) {
      toast.success('Organizacion creada exitosamente')
      router.push('/dashboard')
    } else {
      toast.error(result.message)
      if (result.errors) {
        Object.entries(result.errors).forEach(([field, errors]) => {
          form.setError(field as keyof OnboardingData, {
            message: errors[0],
          })
        })
      }
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`flex items-center gap-2 ${
                s.id === step
                  ? 'text-primary font-medium'
                  : s.id < step
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  s.id < step
                    ? 'bg-primary text-primary-foreground'
                    : s.id === step
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {s.id < step ? <CheckCircle2 className="h-4 w-4" /> : s.id}
              </div>
              <span className="hidden sm:inline text-sm">{s.title}</span>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle>Informacion de tu negocio</CardTitle>
                </div>
                <CardDescription>
                  Ingresa el nombre de tu gimnasio y elige un identificador unico
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del gimnasio *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Iron Fit Gym"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Este es el nombre que veran tus miembros
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identificador (URL) *</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0">
                            gymgo.app/
                          </span>
                          <Input
                            placeholder="mi-gimnasio"
                            className="rounded-l-none"
                            {...field}
                            onChange={(e) => handleSlugChange(e.target.value)}
                          />
                        </div>
                      </FormControl>
                      <div className="flex items-center gap-2 mt-1">
                        {isCheckingSlug && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Verificando disponibilidad...
                          </span>
                        )}
                        {!isCheckingSlug && slugAvailable === true && (
                          <span className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Disponible
                          </span>
                        )}
                        {!isCheckingSlug && slugAvailable === false && (
                          <span className="text-sm text-destructive">
                            Este identificador ya esta en uso
                          </span>
                        )}
                      </div>
                      <FormDescription>
                        Solo letras minusculas, numeros y guiones
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 2: Business Type */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  <CardTitle>Tipo de negocio</CardTitle>
                </div>
                <CardDescription>
                  Selecciona el tipo que mejor describe tu negocio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="business_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid gap-3"
                        >
                          {BUSINESS_TYPE_OPTIONS.map((option) => (
                            <Label
                              key={option.value}
                              htmlFor={option.value}
                              className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                                field.value === option.value
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border'
                              }`}
                            >
                              <RadioGroupItem
                                value={option.value}
                                id={option.value}
                                className="mt-1"
                              />
                              <div className="flex items-center gap-3 flex-1">
                                <div className="p-2 rounded-md bg-muted">
                                  {ICON_MAP[option.icon]}
                                </div>
                                <div>
                                  <p className="font-medium">{option.label}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {option.description}
                                  </p>
                                </div>
                              </div>
                            </Label>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle>Ubicacion y configuracion regional</CardTitle>
                </div>
                <CardDescription>
                  Configura tu pais y moneda de operacion
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pais *</FormLabel>
                      <Select
                        onValueChange={(value) => handleCountryChange(value)}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tu pais" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COUNTRY_OPTIONS.map((country) => (
                            <SelectItem key={country.value} value={country.value}>
                              {country.label}
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
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona la moneda" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCY_OPTIONS.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Esta sera la moneda para tus precios y cobros
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 4: Branding */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  <CardTitle>Personalizacion</CardTitle>
                </div>
                <CardDescription>
                  Elige los colores de tu marca (puedes cambiarlos despues)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="primary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color primario</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <Input
                            type="color"
                            className="w-16 h-10 p-1 cursor-pointer"
                            {...field}
                          />
                          <Input
                            type="text"
                            className="flex-1"
                            placeholder="#000000"
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Color principal de tu marca
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color secundario</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <Input
                            type="color"
                            className="w-16 h-10 p-1 cursor-pointer"
                            {...field}
                          />
                          <Input
                            type="text"
                            className="flex-1"
                            placeholder="#ffffff"
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Color de acento secundario
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Preview */}
                <div className="mt-6 p-4 rounded-lg border">
                  <p className="text-sm font-medium mb-3">Vista previa</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: form.watch('primary_color') }}
                    >
                      {form.watch('name')?.slice(0, 2).toUpperCase() || 'GY'}
                    </div>
                    <div>
                      <p className="font-semibold">{form.watch('name') || 'Tu Gimnasio'}</p>
                      <p className="text-sm text-muted-foreground">
                        gymgo.app/{form.watch('slug') || 'tu-gimnasio'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Atras
            </Button>

            {step < STEPS.length ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || !canProceed()}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Crear organizacion
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
