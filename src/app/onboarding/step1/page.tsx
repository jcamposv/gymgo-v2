'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react'

import { checkSlugAvailability } from '@/actions/onboarding.actions'
import { useOnboarding } from '@/components/onboarding/onboarding-context'

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

const step1Schema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z.string().min(3, 'El identificador debe tener al menos 3 caracteres'),
})

type Step1Data = z.infer<typeof step1Schema>

// =============================================================================
// COMPONENT
// =============================================================================

export default function OnboardingStep1() {
  const router = useRouter()
  const { data, updateData, isHydrated } = useOnboarding()
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)

  const form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: '',
      slug: '',
    },
    mode: 'onChange',
  })

  // Hydrate form with context data
  useEffect(() => {
    if (isHydrated && data) {
      if (data.name) form.setValue('name', data.name)
      if (data.slug) {
        form.setValue('slug', data.slug)
        if (data.slug.length >= 3) {
          checkSlug(data.slug)
        }
      }
    }
  }, [isHydrated, data])

  const checkSlug = async (slug: string) => {
    setIsCheckingSlug(true)
    const { available, error } = await checkSlugAvailability(slug)
    setIsCheckingSlug(false)
    setSlugAvailable(available && !error)
  }

  const handleSlugChange = async (value: string) => {
    const slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
    form.setValue('slug', slug)
    setSlugAvailable(null)

    if (slug.length >= 3) {
      await checkSlug(slug)
    }
  }

  const watchedName = form.watch('name')
  const watchedSlug = form.watch('slug')

  const canProceed = watchedName.length >= 2 && watchedSlug.length >= 3 && slugAvailable === true

  const handleNext = () => {
    updateData({ name: watchedName, slug: watchedSlug })
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del gimnasio</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Iron Fit Gym"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Este es el nombre que verán tus miembros
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
                  <FormLabel>URL de tu gimnasio</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <span className="inline-flex items-center h-11 text-sm text-muted-foreground bg-muted px-3 rounded-l-md border border-r-0 border-input">
                        gymgo.app/
                      </span>
                      <Input
                        placeholder="mi-gimnasio"
                        className="rounded-l-none h-11"
                        {...field}
                        onChange={(e) => handleSlugChange(e.target.value)}
                      />
                    </div>
                  </FormControl>
                  <div className="flex items-center gap-2 min-h-[20px]">
                    {isCheckingSlug && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Verificando...
                      </span>
                    )}
                    {!isCheckingSlug && slugAvailable === true && (
                      <span className="text-sm text-green-600 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Disponible
                      </span>
                    )}
                    {!isCheckingSlug && slugAvailable === false && (
                      <span className="text-sm text-destructive">
                        Este identificador ya está en uso
                      </span>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
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
