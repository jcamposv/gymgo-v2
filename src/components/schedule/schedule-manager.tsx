'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarDays, List, Plus, LayoutTemplate } from 'lucide-react'

import type { Tables } from '@/types/database.types'
import { toggleTemplateStatus, deleteClassTemplate } from '@/actions/template.actions'

import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { WeeklyCalendar } from './weekly-calendar'
import { ClassesCalendar } from './classes-calendar'
import { QuickSlotModal } from './quick-slot-modal'
import { GenerateClassesDialog } from '@/components/templates/generate-dialog'

type ClassTemplate = Tables<'class_templates'>

interface ScheduleManagerProps {
  templates: ClassTemplate[]
  // For table view - pass through to existing table
  tableView: React.ReactNode
}

type ViewType = 'week' | 'template' | 'list'

export function ScheduleManager({ templates, tableView }: ScheduleManagerProps) {
  const router = useRouter()
  const [view, setView] = useState<ViewType>('week')

  // Modal states
  const [slotModalOpen, setSlotModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ClassTemplate | null>(null)
  const [defaultDay, setDefaultDay] = useState<number>(1)
  const [defaultTime, setDefaultTime] = useState<string>('09:00')

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<ClassTemplate | null>(null)

  const activeTemplates = templates.filter((t) => t.is_active)

  // Handlers
  const handleAddSlot = (dayOfWeek: number, suggestedTime?: string) => {
    setEditingTemplate(null)
    setDefaultDay(dayOfWeek)
    setDefaultTime(suggestedTime || '09:00')
    setSlotModalOpen(true)
  }

  const handleEditSlot = (template: ClassTemplate) => {
    setEditingTemplate(template)
    setSlotModalOpen(true)
  }

  const handleDuplicateSlot = (template: ClassTemplate) => {
    // Open modal with template data but as new
    setEditingTemplate(null)
    setDefaultDay(template.day_of_week)
    setDefaultTime(template.start_time.slice(0, 5))
    // Pre-fill the form with template data
    setSlotModalOpen(true)
  }

  const handleDeleteSlot = (template: ClassTemplate) => {
    setDeleteTarget(template)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return

    const result = await deleteClassTemplate(deleteTarget.id)
    if (result.success) {
      toast.success('Plantilla eliminada')
      router.refresh()
    } else {
      toast.error(result.message)
    }
    setDeleteTarget(null)
  }

  const handleToggleStatus = async (template: ClassTemplate) => {
    const result = await toggleTemplateStatus(template.id)
    if (result.success) {
      toast.success(template.is_active ? 'Plantilla desactivada' : 'Plantilla activada')
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const handleModalSuccess = () => {
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <Tabs value={view} onValueChange={(v) => setView(v as ViewType)}>
            <TabsList>
              <TabsTrigger value="week" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                Semana
              </TabsTrigger>
              <TabsTrigger value="template" className="gap-2">
                <LayoutTemplate className="h-4 w-4" />
                Plantilla
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                Lista
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Stats (only for template view) */}
          {view === 'template' && (
            <div className="text-sm text-muted-foreground ml-4">
              {activeTemplates.length} activas de {templates.length} plantillas
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <GenerateClassesDialog disabled={activeTemplates.length === 0} />
          {view === 'template' && (
            <Button onClick={() => handleAddSlot(1, '09:00')}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva plantilla
            </Button>
          )}
          {view === 'week' && (
            <Button variant="outline" onClick={() => router.push('/dashboard/classes/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Clase manual
            </Button>
          )}
        </div>
      </div>

      {/* Content based on view */}
      {view === 'week' && (
        <ClassesCalendar />
      )}

      {view === 'template' && (
        <WeeklyCalendar
          templates={templates}
          onAddSlot={handleAddSlot}
          onEditSlot={handleEditSlot}
          onDuplicateSlot={handleDuplicateSlot}
          onDeleteSlot={handleDeleteSlot}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {view === 'list' && tableView}

      {/* Quick slot modal */}
      <QuickSlotModal
        open={slotModalOpen}
        onOpenChange={setSlotModalOpen}
        template={editingTemplate}
        defaultDayOfWeek={defaultDay}
        defaultTime={defaultTime}
        onSuccess={handleModalSuccess}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar plantilla</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion eliminara la plantilla &quot;{deleteTarget?.name}&quot; permanentemente.
              Las clases ya generadas no seran afectadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
