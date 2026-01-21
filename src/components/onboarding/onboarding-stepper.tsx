'use client'

import { usePathname } from 'next/navigation'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

interface Step {
  number: number
  title: string
  path: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

const steps: Step[] = [
  { number: 1, title: 'Negocio', path: '/onboarding/step1' },
  { number: 2, title: 'Tipo', path: '/onboarding/step2' },
  { number: 3, title: 'Ubicación', path: '/onboarding/step3' },
  { number: 4, title: 'Marca', path: '/onboarding/step4' },
]

// =============================================================================
// COMPONENT
// =============================================================================

export function OnboardingStepper() {
  const pathname = usePathname()

  const getCurrentStep = () => {
    const step = steps.find((s) => s.path === pathname)
    return step?.number ?? 1
  }

  const currentStep = getCurrentStep()

  return (
    <nav aria-label="Progreso" className="w-full">
      <ol className="flex items-center justify-center gap-2 sm:gap-4">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number
          const isCurrent = currentStep === step.number

          return (
            <li key={step.number} className="flex items-center">
              {/* Step */}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full text-sm font-medium transition-all duration-200',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground shadow-lg shadow-primary/25',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={cn(
                    'hidden sm:block text-sm transition-colors',
                    isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
              </div>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'mx-2 sm:mx-4 h-px w-8 sm:w-12 transition-colors',
                    currentStep > step.number ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
