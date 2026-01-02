'use client'

import Link from 'next/link'
import { MessageCircle, Phone } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { statusLabels, memberLabels } from '@/lib/i18n'
import type { MemberExtended } from '@/types/member.types'

interface MemberHeaderCardProps {
  member: MemberExtended
  className?: string
}

const statusStyles: Record<string, string> = {
  active: 'bg-lime-100 text-lime-700 hover:bg-lime-100',
  inactive: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  suspended: 'bg-red-100 text-red-700 hover:bg-red-100',
  cancelled: 'bg-gray-200 text-gray-600 hover:bg-gray-200',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function MemberHeaderCard({ member, className }: MemberHeaderCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 bg-lime-200">
            <AvatarImage src={member.avatar_url || undefined} alt={member.full_name} />
            <AvatarFallback className="bg-lime-200 text-lime-800 text-lg font-medium">
              {getInitials(member.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">{member.full_name}</h1>
              <Badge
                variant="secondary"
                className={cn('text-xs', statusStyles[member.status])}
              >
                {statusLabels[member.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {memberLabels.clientId}: {member.client_id || member.access_code || member.id.slice(0, 6)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Phone className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link href={`/dashboard/members/${member.id}/edit`}>{memberLabels.editData}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
