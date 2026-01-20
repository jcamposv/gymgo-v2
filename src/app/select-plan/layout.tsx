import type { Metadata } from 'next'
import Image from 'next/image'

/**
 * Plan selection page should NOT be indexed by search engines
 */
export const metadata: Metadata = {
  title: 'Selecciona tu plan | GymGo',
  description: 'Elige el plan de GymGo que mejor se adapte a tu gimnasio.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function SelectPlanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
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

      {/* Main content */}
      <main className="flex-1">
        {children}
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
  )
}
