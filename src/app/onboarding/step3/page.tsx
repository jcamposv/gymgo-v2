'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowRight, ArrowLeft } from 'lucide-react'

import { useOnboarding } from '@/components/onboarding/onboarding-context'
import { COUNTRY_OPTIONS, CURRENCY_OPTIONS } from '@/schemas/onboarding.schema'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

// =============================================================================
// SCHEMA
// =============================================================================

const step3Schema = z.object({
  country: z.string().min(1, 'El país es requerido'),
  currency: z.string().min(1, 'La moneda es requerida'),
  timezone: z.string().min(1, 'La zona horaria es requerida'),
  language: z.string().min(1, 'El idioma es requerido'),
})

type Step3Data = z.infer<typeof step3Schema>

// =============================================================================
// COMPONENT
// =============================================================================

export default function OnboardingStep3() {
  const router = useRouter()
  const { data, updateData, isHydrated } = useOnboarding()

  const form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      country: 'MX',
      currency: 'MXN',
      timezone: 'America/Mexico_City',
      language: 'es',
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
    if (isHydrated) {
      if (data.country) form.setValue('country', data.country)
      if (data.currency) form.setValue('currency', data.currency)
      if (data.timezone) form.setValue('timezone', data.timezone)
      if (data.language) form.setValue('language', data.language)
    }
  }, [isHydrated, data])

  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRY_OPTIONS.find((c) => c.value === countryCode)
    if (country) {
      form.setValue('country', countryCode)
      form.setValue('currency', country.currency)
      form.setValue('timezone', country.timezone)
    }
  }

  const watchedCountry = form.watch('country')
  const watchedCurrency = form.watch('currency')
  const watchedTimezone = form.watch('timezone')
  const watchedLanguage = form.watch('language')

  const canProceed = !!watchedCountry && !!watchedCurrency

  const handleNext = () => {
    updateData({
      country: watchedCountry,
      currency: watchedCurrency,
      timezone: watchedTimezone,
      language: watchedLanguage,
    })
    router.push('/onboarding/step4')
  }

  const handleBack = () => {
    updateData({
      country: watchedCountry,
      currency: watchedCurrency,
      timezone: watchedTimezone,
      language: watchedLanguage,
    })
    router.push('/onboarding/step2')
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
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>País</FormLabel>
                  <Select
                    onValueChange={(value) => handleCountryChange(value)}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecciona tu país" />
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
                  <FormLabel>Moneda</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
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
                    Esta será la moneda para tus precios y cobros
                  </FormDescription>
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
