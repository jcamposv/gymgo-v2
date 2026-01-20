import type { Metadata } from 'next'
import Image from 'next/image'
import { OnboardingProvider } from '@/components/onboarding/onboarding-context'
import { OnboardingStepper } from '@/components/onboarding/onboarding-stepper'

/**
 * Onboarding pages should NOT be indexed by search engines
 */
export const metadata: Metadata = {
  title: 'Configurar gimnasio',
  description: 'Configura tu gimnasio en GymGo en pocos pasos.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OnboardingProvider>
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 sm:h-16 items-center justify-center px-4">
            <Image
              src="/default-logo.svg"
              alt="GymGo"
              width={120}
              height={32}
              priority
              className="h-7 sm:h-8 w-auto"
            />
          </div>
        </header>

        {/* Main content - centered */}
        <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-8 md:py-12">
          <div className="w-full max-w-md sm:max-w-lg">
            {/* Welcome text */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                Configura tu gimnasio
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1.5 sm:mt-2">
                Completa los siguientes pasos para empezar
              </p>
            </div>

            {/* Stepper */}
            <OnboardingStepper />

            {/* Step content */}
            <div className="mt-6 sm:mt-8">
              {children}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t py-4 sm:py-6">
          <div className="flex items-center justify-center px-4 text-center text-xs sm:text-sm text-muted-foreground">
            <p>
              ¿Necesitas ayuda?{' '}
              <a href="mailto:contact@gymgo.io" className="text-primary hover:underline">
                contact@gymgo.io
              </a>
            </p>
          </div>
        </footer>
      </div>
    </OnboardingProvider>
  )
}
