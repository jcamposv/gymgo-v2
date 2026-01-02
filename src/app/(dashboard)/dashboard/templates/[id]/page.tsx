import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Pencil, Clock, Users, MapPin, User } from 'lucide-react'

import { getClassTemplate } from '@/actions/template.actions'
import { dayOfWeekLabels, classTypeLabels } from '@/schemas/template.schema'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface TemplateDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: TemplateDetailPageProps) {
  const { id } = await params
  const { data: template } = await getClassTemplate(id)
  return {
    title: template ? `${template.name} | GymGo` : 'Plantilla | GymGo',
  }
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const { id } = await params
  const { data: template, error } = await getClassTemplate(id)

  if (error || !template) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/templates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{template.name}</h1>
              <Badge variant={template.is_active ? 'default' : 'secondary'}>
                {template.is_active ? 'Activa' : 'Inactiva'}
              </Badge>
            </div>
            {template.class_type && (
              <p className="text-muted-foreground">
                {classTypeLabels[template.class_type] || template.class_type}
              </p>
            )}
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/templates/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Dia de la semana</span>
              <Badge variant="outline">{dayOfWeekLabels[template.day_of_week]}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Hora inicio</span>
              <span className="font-medium">{template.start_time}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Hora fin</span>
              <span className="font-medium">{template.end_time}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Capacidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Capacidad maxima</span>
              <span className="font-medium">{template.max_capacity} personas</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Lista de espera</span>
              <span className="font-medium">
                {template.waitlist_enabled ? `Si (max ${template.max_waitlist})` : 'No'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Instructor y ubicacion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Instructor</span>
              <span className="font-medium">{template.instructor_name || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ubicacion</span>
              <span className="font-medium">{template.location || '-'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Reglas de reserva
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Apertura de reservas</span>
              <span className="font-medium">{template.booking_opens_hours} horas antes</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Cierre de reservas</span>
              <span className="font-medium">{template.booking_closes_minutes} min antes</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Limite de cancelacion</span>
              <span className="font-medium">{template.cancellation_deadline_hours} horas antes</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {template.description && (
        <Card>
          <CardHeader>
            <CardTitle>Descripcion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{template.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
