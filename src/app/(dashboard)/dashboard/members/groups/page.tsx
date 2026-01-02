import { UsersRound } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Grupos | GymGo',
}

export default function GroupsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Grupos</h1>
        <p className="text-muted-foreground">
          Organiza tus miembros en grupos y segmentos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersRound className="h-5 w-5" />
            Proximamente
          </CardTitle>
          <CardDescription>
            Esta funcionalidad estara disponible pronto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Podras crear grupos de miembros para:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>• Segmentar por tipo de membresia</li>
            <li>• Crear grupos para clases especiales</li>
            <li>• Enviar comunicaciones a grupos especificos</li>
            <li>• Aplicar descuentos por grupo</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
