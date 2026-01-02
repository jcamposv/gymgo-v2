import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { UserCheck, Clock } from 'lucide-react'

import { getTodayCheckIns } from '@/actions/checkin.actions'
import { CheckInForm } from '@/components/check-in/check-in-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'

export const metadata = {
  title: 'Check-in | GymGo',
}

export default async function CheckInPage() {
  const { data: todayCheckIns, error } = await getTodayCheckIns()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Check-in</h1>
        <p className="text-muted-foreground">
          Registra la entrada de los miembros al gimnasio
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Check-in rapido
            </CardTitle>
            <CardDescription>
              Ingresa el codigo de acceso del miembro o escanea su QR
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CheckInForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Check-ins de hoy ({todayCheckIns?.length ?? 0})
            </CardTitle>
            <CardDescription>
              {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-sm text-destructive">{error}</div>
            ) : todayCheckIns && todayCheckIns.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {todayCheckIns.map((checkIn) => (
                    <div
                      key={checkIn.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs">
                            {checkIn.member ? getInitials(checkIn.member.full_name) : '??'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">
                            {checkIn.member?.full_name ?? 'Miembro desconocido'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(checkIn.checked_in_at), 'HH:mm', { locale: es })}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {checkIn.check_in_method === 'qr' && 'QR'}
                        {checkIn.check_in_method === 'pin' && 'PIN'}
                        {checkIn.check_in_method === 'manual' && 'Manual'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <UserCheck className="h-10 w-10 text-muted-foreground opacity-50 mb-2" />
                <p className="text-muted-foreground">
                  No hay check-ins registrados hoy
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
