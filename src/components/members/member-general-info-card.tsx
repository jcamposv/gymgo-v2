'use client'

import { MoreHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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

export function MemberGeneralInfoCard({ member, className }: MemberGeneralInfoCardProps) {
  const age = member.date_of_birth ? calculateAge(member.date_of_birth) : member.age
  const primaryGoal = member.fitness_goals?.[0]

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base font-semibold">{generalInfoLabels.title}</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          {/* Left column */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{generalInfoLabels.gender}</span>
              <span className="text-sm font-medium">
                {member.gender ? genderLabels[member.gender] || member.gender : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{generalInfoLabels.age}</span>
              <span className="text-sm font-medium">{age ? `${age} ${generalInfoLabels.yearsOld}` : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{generalInfoLabels.dateOfBirth}</span>
              <span className="text-sm font-medium">
                {member.date_of_birth
                  ? formatBirthDate(member.date_of_birth)
                  : '-'}
              </span>
            </div>
          </div>



          {/* Right column */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{generalInfoLabels.fitnessLevel}</span>
              <span className="text-sm font-medium">
                {levelLabels[member.experience_level] || member.experience_level}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{generalInfoLabels.goal}</span>
              <span className="text-sm font-medium">
                {primaryGoal ? goalLabels[primaryGoal] || primaryGoal : '-'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
