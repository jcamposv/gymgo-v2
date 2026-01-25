'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, Clock, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { completeWorkout } from '@/actions/program.actions'

interface CompleteWorkoutButtonProps {
  workoutId: string
  workoutName: string
  /** If false, shows compact button without dialog */
  showDialog?: boolean
}

export function CompleteWorkoutButton({
  workoutId,
  workoutName,
  showDialog = true,
}: CompleteWorkoutButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [durationMinutes, setDurationMinutes] = useState('')
  const [notes, setNotes] = useState('')
  const router = useRouter()

  const handleComplete = async () => {
    setIsLoading(true)

    try {
      const result = await completeWorkout(workoutId, {
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
        notes: notes || undefined,
      })

      if (result.success) {
        toast.success('Entrenamiento completado')
        setIsOpen(false)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Ocurrio un error al completar el entrenamiento.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickComplete = async () => {
    setIsLoading(true)

    try {
      const result = await completeWorkout(workoutId)

      if (result.success) {
        toast.success('Entrenamiento completado')
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Ocurrio un error al completar el entrenamiento.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!showDialog) {
    return (
      <Button
        onClick={handleQuickComplete}
        disabled={isLoading}
        className="w-full bg-lime-600 hover:bg-lime-700 text-white"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Completar Entrenamiento
          </>
        )}
      </Button>
    )
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full bg-lime-600 hover:bg-lime-700 text-white"
        size="lg"
      >
        <CheckCircle2 className="h-4 w-4 mr-2" />
        Completar Entrenamiento
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-lime-600" />
              Completar entrenamiento
            </DialogTitle>
            <DialogDescription>
              Registra tu entrenamiento de &quot;{workoutName}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Duracion (opcional)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="duration"
                  type="number"
                  placeholder="45"
                  min={1}
                  max={480}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">minutos</span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Notas (opcional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Como te sentiste? Aumentaste peso?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleComplete}
              disabled={isLoading}
              className="bg-lime-600 hover:bg-lime-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Completar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
