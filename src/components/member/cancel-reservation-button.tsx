'use client'

import { useState, useTransition } from 'react'
import { X, AlertTriangle, Loader2 } from 'lucide-react'

import { cancelMyReservation } from '@/actions/member-booking.actions'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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

interface CancelReservationButtonProps {
  bookingId: string
  className: string
  disabled?: boolean
  disabledReason?: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'sm' | 'default' | 'lg'
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CancelReservationButton({
  bookingId,
  className,
  disabled = false,
  disabledReason,
  variant = 'ghost',
  size = 'sm',
}: CancelReservationButtonProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleCancel = async () => {
    startTransition(async () => {
      const result = await cancelMyReservation(bookingId)

      if (result.success) {
        toast.success(result.message)
        setOpen(false)
      } else {
        toast.error(result.message)
      }
    })
  }

  const button = (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || isPending}
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </>
      )}
    </Button>
  )

  if (disabled && disabledReason) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{button}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{disabledReason}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {button}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancelar reserva
          </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estas seguro de que deseas cancelar tu reserva para{' '}
            <span className="font-medium text-foreground">{className}</span>?
            <br />
            <br />
            Esta accion no se puede deshacer. Si hay personas en lista de espera,
            se promocionara automaticamente al siguiente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            Volver
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleCancel()
            }}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelando...
              </>
            ) : (
              'Si, cancelar reserva'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
