'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInstructors } from '@/hooks/use-instructors'
import type { Instructor } from '@/actions/instructor.actions'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { UserAvatar } from './user-avatar'

interface InstructorSelectProps {
  value?: string | null
  onValueChange: (instructorId: string | null, instructorName: string | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

// Map database role to AppRole for label lookup
function getRoleLabel(role: string): string {
  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    owner: 'Propietario',
    super_admin: 'Super Admin',
    assistant: 'Asistente',
    trainer: 'Entrenador',
    instructor: 'Instructor',
    nutritionist: 'Nutricionista',
    client: 'Cliente',
    member: 'Miembro',
  }
  return roleLabels[role] || role
}

export function InstructorSelect({
  value,
  onValueChange,
  placeholder = 'Seleccionar instructor...',
  disabled = false,
  className,
}: InstructorSelectProps) {
  const [open, setOpen] = useState(false)
  const { instructors, loading, error } = useInstructors()

  // Find selected instructor
  const selectedInstructor = value
    ? instructors.find(i => i.id === value)
    : null

  const handleSelect = (instructor: Instructor | null) => {
    if (instructor) {
      onValueChange(instructor.id, instructor.full_name)
    } else {
      onValueChange(null, null)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            'w-full justify-between font-normal',
            !selectedInstructor && 'text-muted-foreground',
            className
          )}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando...
            </span>
          ) : selectedInstructor ? (() => {
            const name = selectedInstructor.full_name?.trim() || selectedInstructor.email.split('@')[0]
            return (
              <span className="flex items-center gap-2 truncate">
                <UserAvatar
                  src={selectedInstructor.avatar_url}
                  name={name}
                  size="sm"
                />
                <span className="truncate">{name}</span>
              </span>
            )
          })() : (
            placeholder
          )}
          {selectedInstructor && !disabled ? (
            <X
              className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                handleSelect(null)
              }}
            />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar instructor..." />
          <CommandList>
            {error && (
              <div className="p-4 text-sm text-destructive text-center">
                {error}
              </div>
            )}
            <CommandEmpty>No se encontraron instructores.</CommandEmpty>
            <CommandGroup>
              {instructors.map((instructor) => {
                // Handle both null and empty string
                const displayName = instructor.full_name?.trim() || instructor.email.split('@')[0]
                return (
                  <CommandItem
                    key={instructor.id}
                    value={`${instructor.full_name || ''} ${instructor.email}`}
                    onSelect={() => handleSelect(instructor)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <UserAvatar
                      src={instructor.avatar_url}
                      name={displayName}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {getRoleLabel(instructor.role)}
                      </p>
                    </div>
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4',
                        value === instructor.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
