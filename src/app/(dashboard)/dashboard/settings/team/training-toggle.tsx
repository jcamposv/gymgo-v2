'use client'

import { useState, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import { Dumbbell, Loader2 } from 'lucide-react'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  getStaffTrainingStatus,
  enableStaffTraining,
  disableStaffTraining,
} from '@/actions/user.actions'

interface TrainingToggleProps {
  userId: string
  isCurrentUser?: boolean
}

export function TrainingToggle({ userId, isCurrentUser }: TrainingToggleProps) {
  const [isPending, startTransition] = useTransition()
  const [canTrain, setCanTrain] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load initial status
  useEffect(() => {
    async function loadStatus() {
      const { data } = await getStaffTrainingStatus(userId)
      setCanTrain(data?.canTrain ?? false)
      setIsLoading(false)
    }
    loadStatus()
  }, [userId])

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      const result = checked
        ? await enableStaffTraining(userId)
        : await disableStaffTraining(userId)

      if (result.success) {
        setCanTrain(checked)
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Switch
              id={`training-${userId}`}
              checked={canTrain ?? false}
              onCheckedChange={handleToggle}
              disabled={isPending}
              className="data-[state=checked]:bg-lime-600"
            />
            <Label
              htmlFor={`training-${userId}`}
              className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer"
            >
              <Dumbbell className="h-3 w-3" />
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : canTrain ? (
                'Entrena'
              ) : (
                'No entrena'
              )}
            </Label>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {canTrain
              ? 'Puede recibir rutinas y reservar clases'
              : 'Activar para asignar rutinas y permitir reservas'}
          </p>
          {isCurrentUser && <p className="text-xs text-muted-foreground">Tu perfil</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
