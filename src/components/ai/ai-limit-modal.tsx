'use client'

import { AlertCircle, ArrowUpRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'

// =============================================================================
// Types
// =============================================================================

interface AILimitModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature: 'routine_generation' | 'alternatives' | 'general'
  plan: string
  used: number
  limit: number
}

// =============================================================================
// Feature Labels
// =============================================================================

const FEATURE_LABELS: Record<string, { title: string; description: string }> = {
  routine_generation: {
    title: 'Generación de rutinas con IA',
    description: 'Has alcanzado el límite de rutinas que puedes generar con IA este mes.',
  },
  alternatives: {
    title: 'Alternativas de ejercicios con IA',
    description: 'Has alcanzado el límite de alternativas de ejercicios que puedes solicitar este mes.',
  },
  general: {
    title: 'Consultas de IA',
    description: 'Has alcanzado el límite de consultas de IA de tu plan.',
  },
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratis',
  starter: 'Starter',
  growth: 'Growth',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

// =============================================================================
// Component
// =============================================================================

export function AILimitModal({
  open,
  onOpenChange,
  feature,
  plan,
  used,
  limit,
}: AILimitModalProps) {
  const featureInfo = FEATURE_LABELS[feature] || FEATURE_LABELS.general
  const planLabel = PLAN_LABELS[plan] || plan
  const percentage = limit > 0 ? Math.round((used / limit) * 100) : 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-center">
            Límite de IA alcanzado
          </DialogTitle>
          <DialogDescription className="text-center">
            {featureInfo.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Plan */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Plan actual</span>
            </div>
            <span className="text-sm text-muted-foreground">{planLabel}</span>
          </div>

          {/* Usage Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{featureInfo.title}</span>
              <span className="font-medium">
                {used} / {limit === -1 ? '∞' : limit}
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          {/* Upgrade Benefits */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium">Actualiza tu plan para obtener:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Más generaciones de rutinas con IA
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Acceso a modelos de IA más avanzados
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Límites más altos en todas las funciones
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button asChild className="w-full">
            <Link href="/dashboard/settings/billing">
              Ver planes disponibles
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
