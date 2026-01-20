'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Check } from 'lucide-react'

import { completeOnboarding } from '@/actions/onboarding.actions'
import { useOnboarding } from '@/components/onboarding/onboarding-context'
import type { OnboardingData } from '@/schemas/onboarding.schema'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

// =============================================================================
// SCHEMA
// =============================================================================

const step4Schema = z.object({
  primary_color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color inválido'),
  secondary_color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color inválido'),
})

type Step4Data = z.infer<typeof step4Schema>

// =============================================================================
// COMPONENT
// =============================================================================

export default function OnboardingStep4() {
  const router = useRouter()
  const { data, updateData, clearData, isHydrated } = useOnboarding()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      primary_color: '#84cc16',
      secondary_color: '#1e293b',
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
      if (data.primary_color) form.setValue('primary_color', data.primary_color)
      if (data.secondary_color) form.setValue('secondary_color', data.secondary_color)
    }
  }, [isHydrated, data])

  const watchedPrimaryColor = form.watch('primary_color')
  const watchedSecondaryColor = form.watch('secondary_color')

  const handleBack = () => {
    updateData({
      primary_color: watchedPrimaryColor,
      secondary_color: watchedSecondaryColor,
    })
    router.push('/onboarding/step3')
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    const completeData: OnboardingData = {
      name: data.name!,
      slug: data.slug!,
      business_type: data.business_type!,
      country: data.country || 'MX',
      currency: data.currency || 'MXN',
      timezone: data.timezone || 'America/Mexico_City',
      language: data.language || 'es',
      primary_color: watchedPrimaryColor,
      secondary_color: watchedSecondaryColor,
    }

    const result = await completeOnboarding(completeData)

    if (result.success) {
      clearData()
      toast.success('Organización creada exitosamente')
      router.push('/dashboard')
    } else {
      toast.error(result.message)
      setIsSubmitting(false)
    }
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
              name="primary_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color primario</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Input
                          type="color"
                          className="w-14 h-11 p-1 cursor-pointer rounded-lg border-2"
                          {...field}
                        />
                      </div>
                      <Input
                        type="text"
                        className="flex-1 h-11 font-mono"
                        placeholder="#84cc16"
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
                      <div className="relative">
                        <Input
                          type="color"
                          className="w-14 h-11 p-1 cursor-pointer rounded-lg border-2"
                          {...field}
                        />
                      </div>
                      <Input
                        type="text"
                        className="flex-1 h-11 font-mono"
                        placeholder="#1e293b"
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
            <div className="p-4 rounded-xl bg-muted/50 border">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Vista previa</p>
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                  style={{ backgroundColor: watchedPrimaryColor }}
                >
                  {data.name?.slice(0, 2).toUpperCase() || 'GY'}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{data.name || 'Tu Gimnasio'}</p>
                  <p className="text-sm text-muted-foreground">
                    gymgo.app/{data.slug || 'tu-gimnasio'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
                size="lg"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Atrás
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Finalizar
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
