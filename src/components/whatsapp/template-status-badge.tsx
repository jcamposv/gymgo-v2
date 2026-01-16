'use client'

import { Badge } from '@/components/ui/badge'
import type { WhatsAppTemplateStatus, WhatsAppSetupStatus } from '@/types/whatsapp.types'
import {
  TEMPLATE_STATUS_LABELS,
  SETUP_STATUS_LABELS,
} from '@/schemas/whatsapp.schema'

interface TemplateStatusBadgeProps {
  status: WhatsAppTemplateStatus
}

const templateStatusVariants: Record<WhatsAppTemplateStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  pending_approval: 'outline',
  approved: 'default',
  rejected: 'destructive',
  disabled: 'secondary',
}

export function TemplateStatusBadge({ status }: TemplateStatusBadgeProps) {
  return (
    <Badge variant={templateStatusVariants[status]}>
      {TEMPLATE_STATUS_LABELS[status]}
    </Badge>
  )
}

interface SetupStatusBadgeProps {
  status: WhatsAppSetupStatus
}

const setupStatusVariants: Record<WhatsAppSetupStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  phone_pending: 'outline',
  active: 'default',
  suspended: 'destructive',
}

export function SetupStatusBadge({ status }: SetupStatusBadgeProps) {
  return (
    <Badge variant={setupStatusVariants[status]}>
      {SETUP_STATUS_LABELS[status]}
    </Badge>
  )
}
