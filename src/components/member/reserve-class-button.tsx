'use client'

import { useTransition } from 'react'
import { Loader2, CalendarPlus, UserPlus, AlertCircle } from 'lucide-react'

import { reserveClass } from '@/actions/member-booking.actions'
import { isDailyLimitError } from '@/schemas/booking-limits.schema'

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
  dailyLimitReached?: boolean
  dailyLimitInfo?: {
    limit: number
    currentCount: number
  }
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
  dailyLimitReached = false,
  dailyLimitInfo,
}: ReserveClassButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleReserve = () => {
    startTransition(async () => {
      const result = await reserveClass(classId)

      if (result.success) {
        toast.success(result.message)
      } else {
        // Check if it's a daily limit error and show specific message
        if (isDailyLimitError(result.data)) {
          toast.error(result.message, {
            description: `Tienes ${result.data.currentCount} de ${result.data.limit} clases para el ${result.data.targetDate}`,
            duration: 5000,
          })
        } else {
          toast.error(result.message)
        }
      }
    })
  }

  // Daily limit reached - show disabled state with explanation
  if (dailyLimitReached && dailyLimitInfo) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="w-full">
              <Button
                variant="secondary"
                size="sm"
                disabled
                className="w-full"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Limite diario
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p>
              Ya tienes {dailyLimitInfo.currentCount} de {dailyLimitInfo.limit} clases
              reservadas para este dia
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
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
