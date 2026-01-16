'use client'

import { MoreHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  generalInfoLabels,
  genderLabels,
  levelLabels,
  goalLabels,
  formatBirthDate,
} from '@/lib/i18n'
import type { MemberExtended } from '@/types/member.types'

interface MemberGeneralInfoCardProps {
  member: MemberExtended
  className?: string
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

interface InfoRowProps {
  label: string
  value: string | number | null | undefined
  fallback?: string
}

function InfoRow({ label, value, fallback = '-' }: InfoRowProps) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value || fallback}</span>
    </div>
  )
}

export function MemberGeneralInfoCard({ member, className }: MemberGeneralInfoCardProps) {
  const age = member.date_of_birth ? calculateAge(member.date_of_birth) : member.age
  const primaryGoal = member.fitness_goals?.[0]

  return (
    <Card className={cn('bg-muted/50 border-0 shadow-none', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base font-semibold">{generalInfoLabels.title}</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6">
          {/* Left column */}
          <div className="flex-1 space-y-3">
            <InfoRow
              label={generalInfoLabels.gender}
              value={member.gender ? genderLabels[member.gender] || member.gender : null}
            />
            <InfoRow
              label={generalInfoLabels.age}
              value={age ? `${age} ${generalInfoLabels.yearsOld}` : null}
            />
            <InfoRow
              label={generalInfoLabels.dateOfBirth}
              value={member.date_of_birth ? formatBirthDate(member.date_of_birth) : null}
            />
          </div>

          {/* Vertical divider */}
          <div className="w-px bg-border self-stretch" />

          {/* Right column */}
          <div className="flex-1 space-y-3">
            <InfoRow
              label={generalInfoLabels.fitnessLevel}
              value={member.experience_level ? (levelLabels[member.experience_level] || member.experience_level) : null}
            />
            <InfoRow
              label={generalInfoLabels.goal}
              value={primaryGoal ? goalLabels[primaryGoal] || primaryGoal : null}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
