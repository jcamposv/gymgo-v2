import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { AlertTriangle, Mail, LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogoutButton } from '@/components/auth/logout-button'

export const metadata: Metadata = {
  title: 'Cuenta Deshabilitada | GymGo',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AccountDisabledPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 sm:h-16 items-center justify-center px-4">
          <Image
            src="/default-logo.svg"
            alt="GymGo"
            width={120}
            height={32}
            priority
            className="h-7 sm:h-8 w-auto"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">
              Cuenta Deshabilitada
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Tu cuenta ha sido deshabilitada temporalmente
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              <p className="mb-2">
                Esto puede deberse a:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Período de prueba finalizado sin realizar el pago</li>
                <li>Pago pendiente o fallido</li>
                <li>Solicitud de cancelación</li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Para reactivar tu cuenta, por favor contacta a nuestro equipo de soporte:
              </p>

              <Button asChild className="w-full" size="lg">
                <a href="mailto:contact@gymgo.io?subject=Reactivar%20cuenta%20GymGo">
                  <Mail className="h-4 w-4 mr-2" />
                  Contactar soporte
                </a>
              </Button>

              <LogoutButton variant="outline" className="w-full" size="lg">
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </LogoutButton>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 sm:py-6">
        <div className="flex items-center justify-center px-4 text-center text-xs sm:text-sm text-muted-foreground">
          <p>
            ¿Necesitas ayuda?{' '}
            <a href="mailto:contact@gymgo.io" className="text-primary hover:underline">
              contact@gymgo.io
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
