'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Loader2, ArrowUpRight, Dumbbell, Repeat, MessageSquare, Info, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

import { getAIUsageStats, type AIUsageStats } from '@/actions/ai.actions'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// =============================================================================
// Plan Labels
// =============================================================================

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratis',
  starter: 'Starter',
  growth: 'Growth',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

// =============================================================================
// Tooltip Content
// =============================================================================

const TOOLTIP_CONTENT = {
  generalRequests: 'Cada acción que usa inteligencia artificial consume 1 request.',
  routineGenerations: 'Cada rutina generada automáticamente consume 1 generación.',
  exerciseAlternatives: 'Cada búsqueda de alternativas consume 1 uso de AI.',
}

// =============================================================================
// Helper Component: Info Tooltip
// =============================================================================

function InfoTooltip({ content }: { content: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <p className="text-xs">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// =============================================================================
// Component
// =============================================================================

export function AIUsageSection() {
  const [stats, setStats] = useState<AIUsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAIUsageStats()
      .then((result) => {
        if (result.success && result.data) {
          setStats(result.data)
        } else {
          setError(result.message || 'Error al cargar estadísticas')
        }
      })
      .catch(() => {
        setError('Error al cargar estadísticas')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">{error || 'No hay datos disponibles'}</p>
        </CardContent>
      </Card>
    )
  }

  const formatLimit = (limit: number) => (limit === -1 ? 'Ilimitado' : limit.toString())

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-destructive'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-primary'
  }

  // Check if any quota is at 80% or more (but not unlimited)
  const quotasNearLimit = [
    { name: 'consultas de IA', ...stats.generalRequests },
    { name: 'generaciones de rutina', ...stats.routineGenerations },
    { name: 'alternativas de ejercicio', ...stats.exerciseAlternatives },
  ].filter((q) => q.limit !== -1 && q.percentage >= 80 && q.percentage < 100)

  const showWarning = quotasNearLimit.length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Uso de IA este mes
            </CardTitle>
            <CardDescription>
              Tu consumo de funciones de inteligencia artificial
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs">
            Plan {PLAN_LABELS[stats.plan] || stats.plan}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 80% Warning Alert */}
        {showWarning && (
          <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              Has usado el 80% o más de tu cuota de{' '}
              {quotasNearLimit.map((q) => q.name).join(', ')}.{' '}
              {stats.plan !== 'enterprise' && (
                <Link href="/dashboard/settings?tab=plan" className="underline font-medium">
                  Considera actualizar tu plan
                </Link>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* General AI Requests */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Consultas de IA</span>
              <InfoTooltip content={TOOLTIP_CONTENT.generalRequests} />
            </div>
            <span className="text-sm text-muted-foreground">
              {stats.generalRequests.used} / {formatLimit(stats.generalRequests.limit)}
            </span>
          </div>
          {stats.generalRequests.limit !== -1 && (
            <Progress
              value={stats.generalRequests.percentage}
              className={`h-2 ${getProgressColor(stats.generalRequests.percentage)}`}
            />
          )}
        </div>

        {/* Routine Generations */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Generación de rutinas</span>
              <InfoTooltip content={TOOLTIP_CONTENT.routineGenerations} />
            </div>
            <span className="text-sm text-muted-foreground">
              {stats.routineGenerations.used} / {formatLimit(stats.routineGenerations.limit)}
            </span>
          </div>
          {stats.routineGenerations.limit !== -1 && (
            <Progress
              value={stats.routineGenerations.percentage}
              className={`h-2 ${getProgressColor(stats.routineGenerations.percentage)}`}
            />
          )}
        </div>

        {/* Exercise Alternatives */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Alternativas de ejercicios</span>
              <InfoTooltip content={TOOLTIP_CONTENT.exerciseAlternatives} />
            </div>
            <span className="text-sm text-muted-foreground">
              {stats.exerciseAlternatives.used} / {formatLimit(stats.exerciseAlternatives.limit)}
            </span>
          </div>
          {stats.exerciseAlternatives.limit !== -1 && (
            <Progress
              value={stats.exerciseAlternatives.percentage}
              className={`h-2 ${getProgressColor(stats.exerciseAlternatives.percentage)}`}
            />
          )}
        </div>

        {/* Reset Notice */}
        <p className="text-xs text-muted-foreground">
          Los límites se reinician el {stats.periodEnd}
        </p>

        {/* Upgrade CTA for non-enterprise plans */}
        {stats.plan !== 'enterprise' && (
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/dashboard/settings?tab=plan">
              Ver opciones de plan
              <ArrowUpRight className="ml-2 h-3 w-3" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
