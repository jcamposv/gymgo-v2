'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
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

import { useOnboarding } from '@/components/onboarding/onboarding-context'
import { BUSINESS_TYPE_OPTIONS } from '@/schemas/onboarding.schema'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

// =============================================================================
// SCHEMA
// =============================================================================

const businessTypes = [
  'traditional_gym',
  'crossfit_box',
  'yoga_pilates_studio',
  'hiit_functional',
  'martial_arts',
  'cycling_studio',
  'personal_training',
  'wellness_spa',
  'multi_format',
] as const

const step2Schema = z.object({
  business_type: z.enum(businessTypes, {
    message: 'Selecciona el tipo de negocio',
  }),
})

type Step2Data = z.infer<typeof step2Schema>

// =============================================================================
// ICON MAP
// =============================================================================

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

// =============================================================================
// COMPONENT
// =============================================================================

export default function OnboardingStep2() {
  const router = useRouter()
  const { data, updateData, isHydrated } = useOnboarding()

  const form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      business_type: undefined,
    },
    mode: 'onChange',
  })

  // Redirect to step1 if no name/slug set
  useEffect(() => {
    if (isHydrated && (!data.name || !data.slug)) {
      router.replace('/onboarding/step1')
    }
  }, [isHydrated, data, router])

  // Hydrate form with context data
  useEffect(() => {
    if (isHydrated && data.business_type) {
      form.setValue('business_type', data.business_type as Step2Data['business_type'])
    }
  }, [isHydrated, data])

  const watchedBusinessType = form.watch('business_type')
  const canProceed = !!watchedBusinessType

  const handleNext = () => {
    updateData({ business_type: watchedBusinessType })
    router.push('/onboarding/step3')
  }

  const handleBack = () => {
    updateData({ business_type: watchedBusinessType })
    router.push('/onboarding/step1')
  }

  if (!isHydrated) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <Form {...form}>
          <form className="space-y-5 sm:space-y-6">
            <FormField
              control={form.control}
              name="business_type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid gap-2"
                    >
                      {BUSINESS_TYPE_OPTIONS.map((option) => (
                        <Label
                          key={option.value}
                          htmlFor={option.value}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 ${
                            field.value === option.value
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-border'
                          }`}
                        >
                          <RadioGroupItem
                            value={option.value}
                            id={option.value}
                            className="sr-only"
                          />
                          <div className={`p-2 rounded-md transition-colors ${
                            field.value === option.value ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          }`}>
                            {ICON_MAP[option.icon]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{option.label}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {option.description}
                            </p>
                          </div>
                          {field.value === option.value && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </Label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                className="w-full sm:w-auto"
                size="lg"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Atrás
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed}
                className="w-full sm:w-auto"
                size="lg"
              >
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
