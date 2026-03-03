'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { cancelSubscription, resumeSubscription } from '@/actions/billing.actions'
import { useBilling } from './billing-provider'

export function CancelSubscriptionDialog() {
  const router = useRouter()
  const { subscription } = useBilling()
  const [isLoading, setIsLoading] = useState(false)

  if (!subscription) return null

  // If already set to cancel, show resume option
  if (subscription.cancel_at_period_end) {
    const handleResume = async () => {
      setIsLoading(true)
      const result = await resumeSubscription()
      setIsLoading(false)
      if (result.success) {
        toast.success('Suscripcion reactivada')
        router.refresh()
      } else {
        toast.error(result.message)
      }
    }

    return (
      <Button variant="outline" size="sm" onClick={handleResume} disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Reactivar suscripcion
      </Button>
    )
  }

  const handleCancel = async () => {
    setIsLoading(true)
    const result = await cancelSubscription()
    setIsLoading(false)
    if (result.success) {
      toast.success('La suscripcion se cancelara al final del periodo')
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const endDate = subscription.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('es-MX')
    : 'el final del periodo actual'

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          Cancelar suscripcion
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar suscripcion</AlertDialogTitle>
          <AlertDialogDescription>
            Tu suscripcion se cancelara al final del periodo actual.
            Tendras acceso hasta el {endDate}.
            Puedes reactivar en cualquier momento antes de esa fecha.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Mantener plan</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Confirmar cancelacion
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
