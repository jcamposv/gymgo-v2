'use client'

import {
  MoreHorizontal,
  Ruler,
  Scale,
  Activity,
  Percent,
  Dumbbell,
  CircleDot,
  Plus,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { measurementsCardLabels, formatDateTimeLong } from '@/lib/i18n'
import type { MeasurementWithBMI } from '@/types/member.types'

interface MemberMedicalInfoCardProps {
  measurement: MeasurementWithBMI | null
  className?: string
  onAddMeasurement?: () => void
}

interface MetricItemProps {
  icon: React.ReactNode
  label: string
  value: string | null
  bgColor?: string
}

function MetricItem({ icon, label, value, bgColor = 'bg-lime-50' }: MetricItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', bgColor)}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value || '-'}</p>
      </div>
    </div>
  )
}

export function MemberMedicalInfoCard({
  measurement,
  className,
  onAddMeasurement,
}: MemberMedicalInfoCardProps) {
  // Format height - show in cm, optionally convert to ft/in for display
  const formatHeight = () => {
    if (measurement?.body_height_cm != null) {
      const cm = measurement.body_height_cm
      // Convert to ft/in for US users (optional dual display)
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
      // Also show lbs for reference
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
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Row 1: Core measurements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricItem
            icon={<Ruler className="h-5 w-5 text-lime-700" />}
            label={measurementsCardLabels.height}
            value={formatHeight()}
          />
          <MetricItem
            icon={<Scale className="h-5 w-5 text-lime-700" />}
            label={measurementsCardLabels.weight}
            value={formatWeight()}
          />
          <MetricItem
            icon={<Percent className="h-5 w-5 text-lime-700" />}
            label={measurementsCardLabels.bodyFat}
            value={formatBodyFat()}
          />
          <MetricItem
            icon={<Activity className="h-5 w-5 text-lime-700" />}
            label={measurementsCardLabels.bmi}
            value={formatBMI()}
          />
        </div>

        {/* Row 2: Body composition & circumference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricItem
            icon={<Dumbbell className="h-5 w-5 text-lime-700" />}
            label={measurementsCardLabels.muscleMass}
            value={formatMuscleMass()}
          />
          <MetricItem
            icon={<CircleDot className="h-5 w-5 text-lime-700" />}
            label={measurementsCardLabels.waist}
            value={formatWaist()}
          />
          <MetricItem
            icon={<CircleDot className="h-5 w-5 text-lime-700" />}
            label={measurementsCardLabels.hip}
            value={formatHip()}
            bgColor="bg-purple-50"
          />
        </div>
      </CardContent>
    </Card>
  )
}
