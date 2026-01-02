import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, Pencil, Check, X, Star } from 'lucide-react'

import { getPlan } from '@/actions/plan.actions'
import { billingPeriodLabels } from '@/schemas/plan.schema'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export const metadata = {
  title: 'Detalle del Plan | GymGo',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PlanDetailPage({ params }: PageProps) {
  const { id } = await params
  const { data: plan, error } = await getPlan(id)

  if (error || !plan) {
    notFound()
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
    }).format(price)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/plans">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{plan.name}</h1>
              {plan.is_featured && (
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              )}
            </div>
            <p className="text-muted-foreground">
              Detalle del plan de membresia
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/plans/${plan.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informacion general</CardTitle>
            <CardDescription>Datos basicos del plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nombre</span>
              <span className="font-medium">{plan.name}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Descripcion</span>
              <span className="font-medium text-right max-w-[200px]">
                {plan.description || '-'}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado</span>
              <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                {plan.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Destacado</span>
              <span className="font-medium">
                {plan.is_featured ? 'Si' : 'No'}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Orden</span>
              <span className="font-medium">{plan.sort_order}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Precio y facturacion</CardTitle>
            <CardDescription>Configuracion de cobro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Precio</span>
              <span className="font-medium text-lg">
                {formatPrice(plan.price, plan.currency)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Moneda</span>
              <span className="font-medium">{plan.currency}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Periodo</span>
              <span className="font-medium">
                {billingPeriodLabels[plan.billing_period] || plan.billing_period}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duracion</span>
              <span className="font-medium">{plan.duration_days} dias</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acceso</CardTitle>
            <CardDescription>Configuracion de acceso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Acceso ilimitado</span>
              {plan.unlimited_access ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <Separator />
            {!plan.unlimited_access && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clases por periodo</span>
                  <span className="font-medium">{plan.classes_per_period || '-'}</span>
                </div>
                <Separator />
              </>
            )}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Todas las ubicaciones</span>
              {plan.access_all_locations ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <X className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Beneficios incluidos</CardTitle>
            <CardDescription>Caracteristicas del plan</CardDescription>
          </CardHeader>
          <CardContent>
            {plan.features && plan.features.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {plan.features.map((feature, index) => (
                  <Badge key={index} variant="secondary">
                    {feature}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay beneficios definidos
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Metadatos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Creado</span>
              <span className="font-medium">
                {format(new Date(plan.created_at), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Actualizado</span>
              <span className="font-medium">
                {format(new Date(plan.updated_at), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
