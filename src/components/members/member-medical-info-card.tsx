'use client'

import {
  Ruler,
  Scale,
  Activity,
  Percent,
  Dumbbell,
  CircleDot,
  Plus,
  History,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { measurementsCardLabels, formatDateTimeLong } from '@/lib/i18n'
import type { MeasurementWithBMI } from '@/types/member.types'

// =============================================================================
// TYPES
// =============================================================================

interface MemberMedicalInfoCardProps {
  measurement: MeasurementWithBMI | null
  className?: string
  onAddMeasurement?: () => void
  onViewHistory?: () => void
}

interface MetricItemProps {
  icon: React.ReactNode
  label: string
  value: string | null
  iconBgColor?: string
  iconColor?: string
}

// =============================================================================
// METRIC ITEM COMPONENT
// =============================================================================

function MetricItem({
  icon,
  label,
  value,
  iconBgColor = 'bg-lime-100',
  iconColor = 'text-lime-700'
}: MetricItemProps) {
  return (
    <div className="flex items-center gap-4">
      <div className={cn(
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
        iconBgColor
      )}>
        <div className={iconColor}>{icon}</div>
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-base font-semibold truncate">{value || '-'}</p>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MemberMedicalInfoCard({
  measurement,
  className,
  onAddMeasurement,
  onViewHistory,
}: MemberMedicalInfoCardProps) {
  // Format height - show in cm, optionally convert to ft/in for display
  const formatHeight = () => {
    if (measurement?.body_height_cm != null) {
      const cm = measurement.body_height_cm
      const totalInches = cm / 2.54
      const ft = Math.floor(totalInches / 12)
      const inches = Math.round(totalInches % 12)
      return `${cm} cm (${ft}'${inches}")`
    }
    return null
  }

  // Format weight - show in kg
  const formatWeight = () => {
    if (measurement?.body_weight_kg != null) {
      const kg = measurement.body_weight_kg
      const lbs = Math.round(kg * 2.205)
      return `${kg} kg (${lbs} lbs)`
    }
    return null
  }

  // Format body fat percentage
  const formatBodyFat = () => {
    if (measurement?.body_fat_percentage != null) {
      return `${measurement.body_fat_percentage}%`
    }
    return null
  }

  // Format muscle mass
  const formatMuscleMass = () => {
    if (measurement?.muscle_mass_kg != null) {
      return `${measurement.muscle_mass_kg} kg`
    }
    return null
  }

  // Format waist
  const formatWaist = () => {
    if (measurement?.waist_cm != null) {
      return `${measurement.waist_cm} cm`
    }
    return null
  }

  // Format hip
  const formatHip = () => {
    if (measurement?.hip_cm != null) {
      return `${measurement.hip_cm} cm`
    }
    return null
  }

  // Format BMI with category
  const formatBMI = () => {
    if (measurement?.bmi != null) {
      const bmi = measurement.bmi
      let category = ''
      if (bmi < 18.5) category = measurementsCardLabels.bmiUnderweight
      else if (bmi < 25) category = measurementsCardLabels.bmiNormal
      else if (bmi < 30) category = measurementsCardLabels.bmiOverweight
      else category = measurementsCardLabels.bmiObese
      return `${bmi} (${category})`
    }
    return null
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base font-semibold">{measurementsCardLabels.title}</CardTitle>
        <div className="flex items-center gap-2">
          {measurement && (
            <span className="text-xs text-muted-foreground">
              {measurementsCardLabels.lastUpdated} {formatDateTimeLong(measurement.measured_at)}
            </span>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onAddMeasurement}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onViewHistory}>
            <History className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-0">
        {/* Row 1: Height, Weight, Body Fat */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-4">
          <MetricItem
            icon={<Ruler className="h-5 w-5" />}
            label={measurementsCardLabels.height}
            value={formatHeight()}
          />
          <MetricItem
            icon={<Scale className="h-5 w-5" />}
            label={measurementsCardLabels.weight}
            value={formatWeight()}
          />
          <MetricItem
            icon={<Percent className="h-5 w-5" />}
            label={measurementsCardLabels.bodyFat}
            value={formatBodyFat()}
          />
        </div>

       
       

        {/* Row 2: BMI, Muscle Mass, Waist */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-4">
          <MetricItem
            icon={<Activity className="h-5 w-5" />}
            label={measurementsCardLabels.bmi}
            value={formatBMI()}
          />
          <MetricItem
            icon={<Dumbbell className="h-5 w-5" />}
            label={measurementsCardLabels.muscleMass}
            value={formatMuscleMass()}
          />
          <MetricItem
            icon={<CircleDot className="h-5 w-5" />}
            label={measurementsCardLabels.waist}
            value={formatWaist()}
          />
        </div>

       

        {/* Row 3: Hip (and future metrics) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-4">
          <MetricItem
            icon={<CircleDot className="h-5 w-5" />}
            label={measurementsCardLabels.hip}
            value={formatHip()}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-700"
          />
        </div>

        {/* View History Link */}
        <div className=" pt-4">
          <Button
            variant="ghost"
            className="w-full text-sm text-muted-foreground hover:text-foreground"
            onClick={onViewHistory}
          >
            <History className="h-4 w-4 mr-2" />
            {measurementsCardLabels.viewHistory}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
