'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { updateMemberAvatar } from '@/actions/member.actions'
import { uploadFile, deleteFile, extractPathFromUrl } from '@/lib/storage'
import { MemberProfilePhoto, type ProfilePhotoSaveData } from './profile-photo'
import type { MemberExtended } from '@/types/member.types'

interface MemberHeaderCardProps {
  member: MemberExtended
  organizationId: string
  className?: string
}

const statusStyles: Record<string, string> = {
  active: 'bg-primary text-primary-foreground hover:bg-primary/90',
  inactive: 'bg-gray-500 text-white hover:bg-gray-500/90',
  suspended: 'bg-amber-500 text-white hover:bg-amber-500/90',
  cancelled: 'bg-red-500 text-white hover:bg-red-500/90',
}

export function MemberHeaderCard({ member, organizationId, className }: MemberHeaderCardProps) {
  const router = useRouter()
  const [isSendingInvitation, setIsSendingInvitation] = useState(false)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(
    member.avatar_url ?? null
  )

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

  const handleProfilePhotoSave = useCallback(
    async (data: ProfilePhotoSaveData) => {
      const previousUrl = currentAvatarUrl

      try {
        let newAvatarUrl: string | null = null

        switch (data.type) {
          case 'none':
            // Delete existing uploaded image if any (not local avatars)
            if (previousUrl && !previousUrl.startsWith('/avatar/')) {
              const oldPath = extractPathFromUrl(previousUrl, 'avatars')
              if (oldPath) {
                await deleteFile('avatars', oldPath)
              }
            }
            newAvatarUrl = null
            break

          case 'avatar':
            // Delete existing uploaded image if any
            if (previousUrl && !previousUrl.startsWith('/avatar/')) {
              const oldPath = extractPathFromUrl(previousUrl, 'avatars')
              if (oldPath) {
                await deleteFile('avatars', oldPath)
              }
            }
            newAvatarUrl = data.avatarPath ?? null
            break

          case 'upload':
            if (!data.file) {
              throw new Error('No file provided')
            }

            // Delete existing uploaded image if any
            if (previousUrl && !previousUrl.startsWith('/avatar/')) {
              const oldPath = extractPathFromUrl(previousUrl, 'avatars')
              if (oldPath) {
                await deleteFile('avatars', oldPath)
              }
            }

            // Upload new file
            const result = await uploadFile(data.file, organizationId, {
              bucket: 'avatars',
              folder: 'members',
            })

            if (!result.success || !result.url) {
              throw new Error(result.error || 'Error al subir la imagen')
            }

            newAvatarUrl = result.url
            break
        }

        // Optimistic update
        setCurrentAvatarUrl(newAvatarUrl)

        // Save to database
        const updateResult = await updateMemberAvatar(member.id, newAvatarUrl)

        if (!updateResult.success) {
          // Revert on error
          setCurrentAvatarUrl(previousUrl)
          throw new Error(updateResult.message || 'Error al guardar')
        }

        toast.success('Foto de perfil actualizada')
        router.refresh()
      } catch (error) {
        // Revert on error
        setCurrentAvatarUrl(previousUrl)
        toast.error(
          error instanceof Error ? error.message : 'Error al actualizar la foto'
        )
        throw error
      }
    },
    [currentAvatarUrl, member.id, organizationId, router]
  )

  return (
    <Card className={cn('bg-muted/50 border-0 shadow-none', className)}>
      <CardContent className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          {/* Profile photo with avatar picker */}
          <MemberProfilePhoto
            name={member.full_name}
            avatarUrl={currentAvatarUrl}
            onSave={handleProfilePhotoSave}
            size={64}
          />
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
