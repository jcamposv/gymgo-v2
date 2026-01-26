'use client'

import { useState, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import { Dumbbell, Loader2, CheckCircle2, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getUserViewPreferences, enableMyTraining } from '@/actions/user.actions'

export function MyTrainingSection() {
  const [isPending, startTransition] = useTransition()
  const [canTrain, setCanTrain] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStatus() {
      const { data } = await getUserViewPreferences()
      setCanTrain(data?.hasMemberProfile ?? false)
      setIsLoading(false)
    }
    loadStatus()
  }, [])

  const handleEnable = () => {
    startTransition(async () => {
      const result = await enableMyTraining()

      if (result.success) {
        setCanTrain(true)
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Mi Entrenamiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-lime-600" />
          Mi Entrenamiento
        </CardTitle>
        <CardDescription>
          Configura tu perfil para poder entrenar en el gimnasio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            {canTrain ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">Perfil de Entrenamiento</p>
              <p className="text-sm text-muted-foreground">
                {canTrain
                  ? 'Puedes recibir rutinas, reservar clases y registrar mediciones'
                  : 'Activa tu perfil para poder entrenar'}
              </p>
            </div>
          </div>

          {canTrain ? (
            <Badge variant="default" className="bg-green-600">
              Activo
            </Badge>
          ) : (
            <Button onClick={handleEnable} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activando...
                </>
              ) : (
                <>
                  <Dumbbell className="mr-2 h-4 w-4" />
                  Activar
                </>
              )}
            </Button>
          )}
        </div>

        {canTrain && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Con tu perfil de entrenamiento activo puedes:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Recibir rutinas y programas asignados</li>
              <li>Reservar clases en el gimnasio</li>
              <li>Registrar tus mediciones y progreso</li>
              <li>Acceder a la vista de miembro</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
