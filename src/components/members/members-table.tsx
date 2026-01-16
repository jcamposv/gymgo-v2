'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  Eye,
} from 'lucide-react'

import type { Tables, Database } from '@/types/database.types'

type MemberStatus = Database['public']['Enums']['member_status']
import { deleteMember, updateMemberStatus } from '@/actions/member.actions'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface MembersTableProps {
  members: Tables<'members'>[]
}

const statusConfig: Record<MemberStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Activo', variant: 'default' },
  inactive: { label: 'Inactivo', variant: 'secondary' },
  suspended: { label: 'Suspendido', variant: 'destructive' },
  cancelled: { label: 'Cancelado', variant: 'outline' },
}

export function MembersTable({ members }: MembersTableProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<Tables<'members'> | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!memberToDelete) return

    setIsDeleting(true)
    const result = await deleteMember(memberToDelete.id)
    setIsDeleting(false)

    if (result.success) {
      setDeleteDialogOpen(false)
      setMemberToDelete(null)
    }
  }

  const handleStatusChange = async (id: string, status: MemberStatus) => {
    await updateMemberStatus(id, status)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No hay miembros registrados</p>
        <p className="text-sm text-muted-foreground mt-1">
          Crea tu primer miembro para comenzar
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Miembro</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Check-ins</TableHead>
              <TableHead>Miembro desde</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs">
                        {getInitials(member.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {member.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={member.status ? statusConfig[member.status].variant : 'secondary'}>
                    {member.status ? statusConfig[member.status].label : 'Sin estado'}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">
                  {member.experience_level === 'beginner' && 'Principiante'}
                  {member.experience_level === 'intermediate' && 'Intermedio'}
                  {member.experience_level === 'advanced' && 'Avanzado'}
                </TableCell>
                <TableCell>{member.check_in_count}</TableCell>
                <TableCell>
                  {member.created_at ? format(new Date(member.created_at), 'dd MMM yyyy', { locale: es }) : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/dashboard/members/${member.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/dashboard/members/${member.id}/edit`)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {member.status !== 'active' && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(member.id, 'active')}
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Activar
                        </DropdownMenuItem>
                      )}
                      {member.status === 'active' && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(member.id, 'suspended')}
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Suspender
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          setMemberToDelete(member)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar miembro</DialogTitle>
            <DialogDescription>
              Esta accion eliminara permanentemente a{' '}
              <span className="font-semibold">{memberToDelete?.full_name}</span> y todos
              sus datos asociados. Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
