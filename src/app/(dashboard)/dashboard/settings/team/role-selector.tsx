'use client'

import { useState, useTransition } from 'react'
import { updateUserRole } from '@/actions/user.actions'
import { ROLE_LABELS, ROLE_COLORS, ASSIGNABLE_ROLES } from '@/lib/rbac/role-labels'
import type { AppRole } from '@/lib/rbac'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Check, X } from 'lucide-react'

interface RoleSelectorProps {
  userId: string
  currentRole: AppRole
  isCurrentUser: boolean
}

export function RoleSelector({ userId, currentRole, isCurrentUser }: RoleSelectorProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedRole, setSelectedRole] = useState<AppRole>(currentRole)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // If it's the current user or a super_admin, show a badge instead of selector
  if (isCurrentUser || currentRole === 'super_admin') {
    return (
      <Badge
        variant="outline"
        className={ROLE_COLORS[currentRole]}
      >
        {ROLE_LABELS[currentRole]}
      </Badge>
    )
  }

  const handleRoleChange = (newRole: AppRole) => {
    if (newRole === selectedRole) return

    startTransition(async () => {
      const result = await updateUserRole(userId, newRole)

      if (result.success) {
        setSelectedRole(newRole)
        setFeedback({ type: 'success', message: 'Actualizado' })
      } else {
        setFeedback({ type: 'error', message: result.message })
      }

      // Clear feedback after 3 seconds
      setTimeout(() => setFeedback(null), 3000)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-md z-10">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
        <Select
          value={selectedRole}
          onValueChange={(value) => handleRoleChange(value as AppRole)}
          disabled={isPending}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue>
              <Badge
                variant="outline"
                className={ROLE_COLORS[selectedRole]}
              >
                {ROLE_LABELS[selectedRole]}
              </Badge>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ASSIGNABLE_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                <span className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={ROLE_COLORS[role]}
                  >
                    {ROLE_LABELS[role]}
                  </Badge>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {feedback && (
        <span className={`text-xs flex items-center gap-1 ${
          feedback.type === 'success' ? 'text-green-600' : 'text-red-600'
        }`}>
          {feedback.type === 'success' ? (
            <Check className="h-3 w-3" />
          ) : (
            <X className="h-3 w-3" />
          )}
          {feedback.message}
        </span>
      )}
    </div>
  )
}
