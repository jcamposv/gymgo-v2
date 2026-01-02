import { Tag } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Promociones | GymGo',
}

export default function PromotionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Promociones</h1>
        <p className="text-muted-foreground">
          Gestiona cupones y ofertas especiales
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Proximamente
          </CardTitle>
          <CardDescription>
            Esta funcionalidad estara disponible pronto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Podras crear promociones y cupones para:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>• Descuentos por temporada</li>
            <li>• Codigos de referidos</li>
            <li>• Ofertas de inscripcion</li>
            <li>• Promociones por aniversario</li>
            <li>• Paquetes especiales</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
