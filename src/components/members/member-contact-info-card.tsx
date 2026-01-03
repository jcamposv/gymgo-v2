'use client'

import { MoreHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { contactInfoLabels } from '@/lib/i18n'
import type { MemberExtended } from '@/types/member.types'

interface MemberContactInfoCardProps {
  member: MemberExtended
  className?: string
}

export function MemberContactInfoCard({ member, className }: MemberContactInfoCardProps) {
  const address = [
    member.address_line1,
    member.address_line2,
    [member.city, member.state, member.country].filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <Card className={cn('bg-muted/50 border-0 shadow-none', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base font-semibold">{contactInfoLabels.title}</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{contactInfoLabels.phoneNumber}</p>
          <p className="text-sm font-medium">{member.phone || '-'}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">{contactInfoLabels.email}</p>
          <p className="text-sm font-medium">{member.email}</p>
        </div>

        {address && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">{contactInfoLabels.address}</p>
            <p className="text-sm font-medium whitespace-pre-line">{address}</p>
          </div>
        )}

        {(member.emergency_contact_name || member.emergency_contact_phone) && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">{contactInfoLabels.emergencyContact}</p>
            <p className="text-sm font-medium">
              {member.emergency_contact_name}
              {member.emergency_contact_relation && ` - ${member.emergency_contact_relation}`}
            </p>
            {member.emergency_contact_phone && (
              <p className="text-sm text-muted-foreground">{member.emergency_contact_phone}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
