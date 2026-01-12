'use client'

import { useState } from 'react'
import { Plus, MoreVertical, Copy, Trash2, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/database.types'
import { dayOfWeekLabels } from '@/schemas/template.schema'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type ClassTemplate = Tables<'class_templates'>

interface WeeklyCalendarProps {
  templates: ClassTemplate[]
  onAddSlot: (dayOfWeek: number, suggestedTime?: string) => void
  onEditSlot: (template: ClassTemplate) => void
  onDuplicateSlot: (template: ClassTemplate) => void
  onDeleteSlot: (template: ClassTemplate) => void
  onToggleStatus: (template: ClassTemplate) => void
}

// Generate time slots from 0:00 to 23:00
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  return `${i.toString().padStart(2, '0')}:00`
})

// Days of week (Monday = 1, Sunday = 0)
const DAYS_ORDER = [1, 2, 3, 4, 5, 6, 0] // Mon-Sun

// Helper to extract hour from time string (handles HH:MM, HH:MM:SS, or any format)
function getHourKey(timeStr: string): string {
  // Handle different time formats
  const parts = timeStr.split(':')
  if (parts.length >= 1) {
    const hour = parts[0].padStart(2, '0')
    return `${hour}:00`
  }
  return '00:00'
}

export function WeeklyCalendar({
  templates,
  onAddSlot,
  onEditSlot,
  onDuplicateSlot,
  onDeleteSlot,
  onToggleStatus,
}: WeeklyCalendarProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)

  // Group templates by day and hour (normalize time to HH:00)
  const templatesByDayTime = templates.reduce((acc, template) => {
    const hourKey = getHourKey(template.start_time)
    const key = `${template.day_of_week}-${hourKey}`
    if (!acc[key]) acc[key] = []
    acc[key].push(template)
    return acc
  }, {} as Record<string, ClassTemplate[]>)

  // Get templates for a specific day (for column display)
  const getTemplatesForDay = (dayOfWeek: number) => {
    return templates
      .filter((t) => t.day_of_week === dayOfWeek)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }

  // Find the closest time slot for a template
  const getTemplatePosition = (startTime: string) => {
    const [hours] = startTime.split(':').map(Number)
    return Math.max(0, hours - 5) // Offset from 5:00
  }

  return (
    <TooltipProvider>
      <div className="border rounded-lg overflow-hidden bg-background">
        {/* Empty state */}
        {templates.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <p>No hay plantillas configuradas</p>
            <p className="text-sm mt-1">Haz clic en cualquier celda para agregar una clase</p>
          </div>
        )}

        {/* Header row with days */}
        <div className="grid grid-cols-8 border-b bg-muted/50">
          <div className="p-3 text-sm font-medium text-muted-foreground border-r">
            Hora
          </div>
          {DAYS_ORDER.map((day) => {
            const dayTemplates = getTemplatesForDay(day)
            return (
              <div
                key={day}
                className="p-3 text-center border-r last:border-r-0"
              >
                <div className="font-medium">{dayOfWeekLabels[day]}</div>
                <div className="text-xs text-muted-foreground">
                  {dayTemplates.length} clases
                </div>
              </div>
            )
          })}
        </div>

        {/* Time slots grid */}
        <div className="relative">
          {TIME_SLOTS.map((time, timeIndex) => (
            <div key={time} className="grid grid-cols-8 border-b last:border-b-0">
              {/* Time label */}
              <div className="p-2 text-sm text-muted-foreground border-r bg-muted/30 flex items-center justify-center">
                {time}
              </div>

              {/* Day cells */}
              {DAYS_ORDER.map((day) => {
                const cellKey = `${day}-${time}`
                const cellTemplates = templatesByDayTime[cellKey] || []
                const isHovered = hoveredCell === cellKey

                return (
                  <div
                    key={cellKey}
                    className={cn(
                      'min-h-[60px] p-1 border-r last:border-r-0 relative transition-colors',
                      isHovered && 'bg-muted/50'
                    )}
                    onMouseEnter={() => setHoveredCell(cellKey)}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {/* Existing templates */}
                    {cellTemplates.map((template) => (
                      <TemplateSlotCard
                        key={template.id}
                        template={template}
                        onEdit={() => onEditSlot(template)}
                        onDuplicate={() => onDuplicateSlot(template)}
                        onDelete={() => onDeleteSlot(template)}
                        onToggleStatus={() => onToggleStatus(template)}
                      />
                    ))}

                    {/* Add button (shown on hover if no template) */}
                    {cellTemplates.length === 0 && isHovered && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute inset-1 h-auto opacity-60 hover:opacity-100 border-2 border-dashed"
                        onClick={() => onAddSlot(day, time)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Add more button (if slot exists) */}
                    {cellTemplates.length > 0 && isHovered && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-1 right-1 h-6 w-6 opacity-60 hover:opacity-100"
                        onClick={() => onAddSlot(day, time)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  )
}

// Slot card component
interface TemplateSlotCardProps {
  template: ClassTemplate
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onToggleStatus: () => void
}

function TemplateSlotCard({
  template,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleStatus,
}: TemplateSlotCardProps) {
  const isActive = template.is_active

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'group relative rounded-md p-2 text-xs cursor-pointer transition-all',
            'hover:ring-2 hover:ring-primary/50',
            isActive
              ? 'bg-primary/10 border border-primary/20'
              : 'bg-muted/50 border border-muted opacity-60'
          )}
          onClick={onEdit}
        >
          {/* Time badge */}
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium">
              {template.start_time.slice(0, 5)}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onToggleStatus}>
                  {isActive ? 'Desactivar' : 'Activar'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Class name */}
          <div className="font-medium truncate">{template.name}</div>

          {/* Details */}
          <div className="text-muted-foreground truncate">
            {template.instructor_name || 'Sin instructor'}
          </div>

          {/* Capacity badge */}
          <Badge variant="secondary" className="mt-1 text-[10px]">
            {template.max_capacity} cupos
          </Badge>

          {/* Inactive indicator */}
          {!isActive && (
            <Badge variant="outline" className="absolute top-1 right-1 text-[10px]">
              Inactiva
            </Badge>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[200px]">
        <div className="space-y-1">
          <p className="font-medium">{template.name}</p>
          <p className="text-xs">
            {template.start_time.slice(0, 5)} - {template.end_time.slice(0, 5)}
          </p>
          {template.class_type && (
            <p className="text-xs text-muted-foreground">{template.class_type}</p>
          )}
          {template.location && (
            <p className="text-xs text-muted-foreground">{template.location}</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
