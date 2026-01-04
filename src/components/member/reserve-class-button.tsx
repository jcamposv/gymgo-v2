'use client'

import { useTransition } from 'react'
import { Loader2, CalendarPlus, UserPlus } from 'lucide-react'

import { reserveClass } from '@/actions/member-booking.actions'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'

// =============================================================================
// TYPES
// =============================================================================

interface ReserveClassButtonProps {
  classId: string
  className: string
  isFull: boolean
  waitlistEnabled: boolean
  hasMyBooking: boolean
  myBookingStatus: string | null
  disabled?: boolean
  disabledReason?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ReserveClassButton({
  classId,
  className,
  isFull,
  waitlistEnabled,
  hasMyBooking,
  myBookingStatus,
  disabled = false,
  disabledReason,
}: ReserveClassButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleReserve = () => {
    startTransition(async () => {
      const result = await reserveClass(classId)

      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  // Already has booking
  if (hasMyBooking) {
    const statusText = myBookingStatus === 'confirmed' ? 'Reservada' : 'En lista'
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="w-full"
      >
        {statusText}
      </Button>
    )
  }

  // Determine button text and behavior
  let buttonText = 'Reservar'
  let buttonIcon = <CalendarPlus className="h-4 w-4 mr-2" />
  let buttonVariant: 'default' | 'outline' = 'default'

  if (isFull) {
    if (waitlistEnabled) {
      buttonText = 'Lista de espera'
      buttonIcon = <UserPlus className="h-4 w-4 mr-2" />
      buttonVariant = 'outline'
    } else {
      // Full and no waitlist
      return (
        <Button
          variant="secondary"
          size="sm"
          disabled
          className="w-full"
        >
          Clase llena
        </Button>
      )
    }
  }

  const button = (
    <Button
      variant={buttonVariant}
      size="sm"
      onClick={handleReserve}
      disabled={disabled || isPending}
      className="w-full"
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Reservando...
        </>
      ) : (
        <>
          {buttonIcon}
          {buttonText}
        </>
      )}
    </Button>
  )

  if (disabled && disabledReason) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="w-full">{button}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{disabledReason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return button
}
