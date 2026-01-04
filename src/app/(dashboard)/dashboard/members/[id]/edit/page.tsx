import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

import { getMember } from '@/actions/member.actions'
import { getMemberProfileRole, type MemberAccountStatus } from '@/actions/user.actions'
import { requireAdmin } from '@/lib/auth/server-auth'
import { mapLegacyRole } from '@/lib/rbac/helpers'
import { MemberForm } from '@/components/members'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Editar Miembro | GymGo',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditMemberPage({ params }: PageProps) {
  const { id } = await params
  const { data: member, error } = await getMember(id)

  if (error || !member) {
    notFound()
  }

  // Check if current user is admin (can edit roles)
  const { authorized: isAdmin } = await requireAdmin()

  // Get member's account status (has account, role, invitation status)
  const { data: accountStatus } = await getMemberProfileRole(id)

  // Map the role if member has an account
  const profileRole = accountStatus?.hasAccount && accountStatus.role
    ? mapLegacyRole(accountStatus.role)
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/members/${id}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Miembro</h1>
          <p className="text-muted-foreground">
            {member.full_name}
          </p>
        </div>
      </div>

      <MemberForm
        mode="edit"
        member={member}
        accountStatus={accountStatus}
        profileRole={profileRole}
        canEditRole={isAdmin}
      />
    </div>
  )
}
