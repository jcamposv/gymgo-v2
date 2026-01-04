import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dumbbell, Calendar, Clock, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function MemberWorkoutsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mis Rutinas</h1>
        <p className="text-muted-foreground">
          Tus rutinas de entrenamiento asignadas por tu entrenador
        </p>
      </div>

      {/* Current Routines */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Rutinas Activas</h2>

        {/* Placeholder - will show real routines when implemented */}
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
            <p className="text-muted-foreground">
              No tienes rutinas asignadas actualmente
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Tu entrenador te asignara rutinas personalizadas basadas en tus objetivos
            </p>
          </CardContent>
        </Card>

        {/* Example Routine Card - for reference when data exists */}
        {false && (
          <Card className="hover:border-lime-300 transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-lime-600" />
                    Rutina de Fuerza - Tren Superior
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Lunes, Miercoles y Viernes
                  </CardDescription>
                </div>
                <Badge className="bg-lime-100 text-lime-800">Activa</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  3 dias/semana
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  45-60 min
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">8 ejercicios</span>
                <Button variant="ghost" size="sm" className="text-lime-600">
                  Ver rutina
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Workout History */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Historial de Entrenamientos</h2>

        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
            <p className="text-muted-foreground">
              Aqui veras tu historial de entrenamientos completados
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Registra tus entrenamientos para hacer seguimiento de tu progreso
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
