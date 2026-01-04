'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageCircle, Phone, Mail, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { statusLabels, memberLabels } from '@/lib/i18n'
import { resendMemberInvitation } from '@/actions/invitation.actions'
import type { MemberExtended } from '@/types/member.types'

interface MemberHeaderCardProps {
  member: MemberExtended
  className?: string
}

const statusStyles: Record<string, string> = {
  active: 'bg-primary text-primary-foreground hover:bg-primary/90',
  inactive: 'bg-gray-500 text-white hover:bg-gray-500/90',
  suspended: 'bg-amber-500 text-white hover:bg-amber-500/90',
  cancelled: 'bg-red-500 text-white hover:bg-red-500/90',
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
  const [isSendingInvitation, setIsSendingInvitation] = useState(false)

  const handleResendInvitation = async () => {
    if (!member.email) {
      toast.error('El miembro no tiene email registrado')
      return
    }

    setIsSendingInvitation(true)
    try {
      const result = await resendMemberInvitation(member.id)

      if (result.success) {
        toast.success('Invitación enviada correctamente')
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Error al enviar la invitación')
    } finally {
      setIsSendingInvitation(false)
    }
  }

  return (
    <Card className={cn('bg-muted/50 border-0 shadow-none', className)}>
      <CardContent className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          {/* Square avatar with rounded corners */}
          <div className="h-16 w-16 rounded-xl bg-lime-200 flex items-center justify-center shrink-0">
            <span className="text-lime-800 text-xl font-medium">
              {getInitials(member.full_name)}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">{member.full_name}</h1>
              <Badge className={cn('text-xs font-medium', statusStyles[member.status])}>
                {statusLabels[member.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {memberLabels.clientId}: {member.client_id || member.access_code || member.id.slice(0, 6)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Resend Invitation Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                disabled={isSendingInvitation}
              >
                {isSendingInvitation ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Mail className="h-5 w-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleResendInvitation} disabled={isSendingInvitation}>
                <Mail className="mr-2 h-4 w-4" />
                {isSendingInvitation ? 'Enviando...' : 'Reenviar invitación por correo'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="icon" className="h-10 w-10 rounded-full">
            <MessageCircle className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-full">
            <Phone className="h-5 w-5" />
          </Button>
          <Button asChild>
            <Link href={`/dashboard/members/${member.id}/edit`}>{memberLabels.editData}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
