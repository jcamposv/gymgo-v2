'use client'

import { CalendarDays, Target, TrendingUp, CheckCircle2 } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import type { WeeklyProgress, ProgramProgress } from '@/types/program.types'

// =============================================================================
// PROGRAM PROGRESS CARD
// =============================================================================

interface ProgramProgressCardProps {
  programName: string
  progress: ProgramProgress
  weeklyProgress?: WeeklyProgress
}

export function ProgramProgressCard({
  programName,
  progress,
  weeklyProgress,
}: ProgramProgressCardProps) {
  return (
    <Card className="border-lime-200/50 bg-gradient-to-br from-lime-50/50 to-white">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-lime-600" />
              Mi Programa
            </CardTitle>
            <CardDescription className="mt-1 font-medium text-foreground">
              {programName}
            </CardDescription>
          </div>
          {progress.isCompleted && (
            <Badge className="bg-lime-600 text-white">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Program Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              Semana {progress.currentWeek} de {progress.totalWeeks}
            </span>
            <span className="font-medium">{progress.percentageComplete}%</span>
          </div>
          <Progress value={progress.percentageComplete} className="h-2" />
        </div>

        {/* Weekly Progress */}
        {weeklyProgress && !progress.isCompleted && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Esta semana</span>
              <span className="font-medium">
                {weeklyProgress.daysCompletedThisWeek}/{weeklyProgress.daysPerWeek} dias
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: weeklyProgress.daysPerWeek }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    i < weeklyProgress.daysCompletedThisWeek
                      ? 'bg-lime-500'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-lime-600">
              {progress.totalDaysCompleted}
            </div>
            <div className="text-xs text-muted-foreground">
              Entrenamientos
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-lime-600">
              {progress.daysRemaining}
            </div>
            <div className="text-xs text-muted-foreground">
              Por completar
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// COMPACT WEEKLY PROGRESS
// =============================================================================

interface WeeklyProgressBadgeProps {
  progress: WeeklyProgress
}

export function WeeklyProgressBadge({ progress }: WeeklyProgressBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <TrendingUp className="h-3.5 w-3.5" />
        <span>Semana {progress.currentWeek}</span>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: progress.daysPerWeek }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-3 rounded-full ${
              i < progress.daysCompletedThisWeek
                ? 'bg-lime-500'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
