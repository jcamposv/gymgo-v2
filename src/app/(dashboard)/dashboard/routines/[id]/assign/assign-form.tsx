'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Search } from 'lucide-react'

import { assignRoutineToMember } from '@/actions/routine.actions'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Member {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
}

interface AssignRoutineFormProps {
  routineId: string
  routineName: string
  members: Member[]
}

export function AssignRoutineForm({ routineId, routineName, members }: AssignRoutineFormProps) {
  const router = useRouter()
  const [assigning, setAssigning] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [scheduledDate, setScheduledDate] = useState('')

  const filteredMembers = members.filter(
    (m) =>
      m.full_name.toLowerCase().includes(query.toLowerCase()) ||
      m.email.toLowerCase().includes(query.toLowerCase())
  )

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
      router.push('/dashboard/routines')
    } else {
      toast.error(result.message)
    }
    setAssigning(false)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Buscar miembro</label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Nombre o email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
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
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          Miembros activos ({filteredMembers.length})
        </label>
        <ScrollArea className="h-[300px] border rounded-lg p-2">
          {filteredMembers.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No se encontraron miembros</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedMember?.id === member.id
                      ? 'bg-primary/10 border border-primary'
                      : 'border border-transparent'
                  }`}
                  onClick={() => setSelectedMember(member)}
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {member.full_name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.full_name}</p>
                    <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {selectedMember && (
        <div className="p-4 border rounded-lg bg-muted/30">
          <p className="text-sm text-muted-foreground">Asignar a:</p>
          <p className="font-medium">{selectedMember.full_name}</p>
          <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
        </div>
      )}

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/routines/${routineId}`)}
        >
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
      </div>
    </div>
  )
}
