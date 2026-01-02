'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, UserPlus, Search } from 'lucide-react'

import { assignRoutineToMember } from '@/actions/routine.actions'
import { getMembers } from '@/actions/member.actions'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'

interface Member {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
}

interface AssignDialogProps {
  routineId: string
  routineName: string
  trigger?: React.ReactNode
}

export function AssignDialog({ routineId, routineName, trigger }: AssignDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [scheduledDate, setScheduledDate] = useState('')

  const loadMembers = async () => {
    setLoading(true)
    const { data } = await getMembers({
      query: query || undefined,
      status: 'active',
      per_page: 50,
    })
    setMembers(data || [])
    setLoading(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      loadMembers()
    } else {
      setSelectedMember(null)
      setScheduledDate('')
      setQuery('')
    }
  }

  const handleSearch = () => {
    loadMembers()
  }

  const handleAssign = async () => {
    if (!selectedMember) return

    setAssigning(true)
    const result = await assignRoutineToMember(
      routineId,
      selectedMember.id,
      scheduledDate || undefined
    )

    if (result.success) {
      toast.success(result.message)
      setOpen(false)
      router.refresh()
    } else {
      toast.error(result.message)
    }
    setAssigning(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <UserPlus className="mr-2 h-4 w-4" />
            Asignar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar rutina</DialogTitle>
          <DialogDescription>
            Asignar <strong>{routineName}</strong> a un miembro
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar miembro..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={handleSearch}>
              Buscar
            </Button>
          </div>

          <div>
            <label className="text-sm font-medium">Fecha programada (opcional)</label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="mt-1"
            />
          </div>

          <ScrollArea className="h-[200px] border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Cargando...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No se encontraron miembros</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedMember?.id === member.id ? 'bg-primary/10 border border-primary' : ''
                    }`}
                    onClick={() => setSelectedMember(member)}
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.full_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium">
                          {member.full_name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{member.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAssign} disabled={!selectedMember || assigning}>
            {assigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Asignando...
              </>
            ) : (
              'Asignar rutina'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
