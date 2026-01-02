'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { getMembers } from '@/actions/member.actions'
import { createBooking } from '@/actions/booking.actions'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Member {
  id: string
  full_name: string
  email: string
  status: string
}

interface AddBookingDialogProps {
  classId: string
}

export function AddBookingDialog({ classId }: AddBookingDialogProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  useEffect(() => {
    const searchMembers = async () => {
      if (!open) return

      setIsSearching(true)
      const { data } = await getMembers({
        query: search,
        status: 'active',
        per_page: 20,
      })
      setMembers((data as Member[]) ?? [])
      setIsSearching(false)
    }

    const debounce = setTimeout(searchMembers, 300)
    return () => clearTimeout(debounce)
  }, [search, open])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleBooking = async () => {
    if (!selectedMember) return

    setIsLoading(true)
    const result = await createBooking({
      class_id: classId,
      member_id: selectedMember.id,
    })
    setIsLoading(false)

    if (result.success) {
      toast.success(result.message)
      setOpen(false)
      setSelectedMember(null)
      setSearch('')
    } else {
      toast.error(result.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Agregar reserva
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agregar reserva</DialogTitle>
          <DialogDescription>
            Busca y selecciona un miembro para agregar a la clase
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar miembro por nombre o email..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {selectedMember ? (
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getInitials(selectedMember.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{selectedMember.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedMember.email}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMember(null)}
                >
                  Cambiar
                </Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[300px] rounded-lg border">
              {isSearching ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : members.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {search ? 'No se encontraron miembros' : 'Escribe para buscar miembros'}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {members.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">
                          {getInitials(member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{member.full_name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {member.email}
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {member.status === 'active' ? 'Activo' : member.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleBooking} disabled={!selectedMember || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reservando...
              </>
            ) : (
              'Confirmar reserva'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
