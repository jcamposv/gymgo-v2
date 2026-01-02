import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, Pencil, Mail, Phone, Calendar, Activity } from 'lucide-react'

import { getMember } from '@/actions/member.actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

export const metadata = {
  title: 'Detalle de Miembro | GymGo',
}

interface PageProps {
  params: Promise<{ id: string }>
}

const statusLabels = {
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido',
  cancelled: 'Cancelado',
}

const statusVariants = {
  active: 'default' as const,
  inactive: 'secondary' as const,
  suspended: 'destructive' as const,
  cancelled: 'outline' as const,
}

export default async function MemberDetailPage({ params }: PageProps) {
  const { id } = await params
  const { data: member, error } = await getMember(id)

  if (error || !member) {
    notFound()
  }

  const initials = member.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/members">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{member.full_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={statusVariants[member.status]}>
                  {statusLabels[member.status]}
                </Badge>
                <span className="text-muted-foreground">
                  Miembro desde {format(new Date(member.created_at), 'MMMM yyyy', { locale: es })}
                </span>
              </div>
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/members/${member.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informacion de contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{member.email}</span>
            </div>
            {member.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{member.phone}</span>
              </div>
            )}
            {member.date_of_birth && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(member.date_of_birth), 'dd MMMM yyyy', { locale: es })}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estadisticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span>Total check-ins</span>
              </div>
              <span className="font-bold text-lg">{member.check_in_count}</span>
            </div>
            {member.last_check_in && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ultimo check-in</span>
                <span>{format(new Date(member.last_check_in), 'dd MMM yyyy HH:mm', { locale: es })}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Nivel</span>
              <span className="capitalize">
                {member.experience_level === 'beginner' && 'Principiante'}
                {member.experience_level === 'intermediate' && 'Intermedio'}
                {member.experience_level === 'advanced' && 'Avanzado'}
              </span>
            </div>
          </CardContent>
        </Card>

        {(member.emergency_contact_name || member.emergency_contact_phone) && (
          <Card>
            <CardHeader>
              <CardTitle>Contacto de emergencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {member.emergency_contact_name && (
                <p className="font-medium">{member.emergency_contact_name}</p>
              )}
              {member.emergency_contact_phone && (
                <p className="text-muted-foreground">{member.emergency_contact_phone}</p>
              )}
            </CardContent>
          </Card>
        )}

        {(member.medical_conditions || member.injuries) && (
          <Card>
            <CardHeader>
              <CardTitle>Informacion medica</CardTitle>
              <CardDescription>Solo visible para el staff</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {member.medical_conditions && (
                <div>
                  <p className="text-sm font-medium mb-1">Condiciones medicas</p>
                  <p className="text-sm text-muted-foreground">{member.medical_conditions}</p>
                </div>
              )}
              {member.injuries && (
                <div>
                  <p className="text-sm font-medium mb-1">Lesiones</p>
                  <p className="text-sm text-muted-foreground">{member.injuries}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {member.internal_notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Notas internas</CardTitle>
              <CardDescription>Solo visible para el staff</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {member.internal_notes}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
