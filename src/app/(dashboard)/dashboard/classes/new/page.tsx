import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

import { ClassForm } from '@/components/classes'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Nueva Clase | GymGo',
}

export default function NewClassPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/classes">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nueva Clase</h1>
          <p className="text-muted-foreground">
            Programa una nueva clase para tu gimnasio
          </p>
        </div>
      </div>

      <ClassForm mode="create" />
    </div>
  )
}
