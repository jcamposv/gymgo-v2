import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

import { MemberForm } from '@/components/members'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Nuevo Miembro | GymGo',
}

export default function NewMemberPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/members">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Miembro</h1>
          <p className="text-muted-foreground">
            Agrega un nuevo miembro a tu gimnasio
          </p>
        </div>
      </div>

      <MemberForm mode="create" />
    </div>
  )
}
