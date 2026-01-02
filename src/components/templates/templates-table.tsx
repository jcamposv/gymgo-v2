'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Power,
} from 'lucide-react'

import { deleteClassTemplate, toggleTemplateStatus } from '@/actions/template.actions'
import { dayOfWeekLabels, classTypeLabels } from '@/schemas/template.schema'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface ClassTemplate {
  id: string
  name: string
  description: string | null
  class_type: string | null
  day_of_week: number
  start_time: string
  end_time: string
  max_capacity: number
  waitlist_enabled: boolean
  instructor_name: string | null
  location: string | null
  is_active: boolean
}

interface TemplatesTableProps {
  templates: ClassTemplate[]
}

export function TemplatesTable({ templates }: TemplatesTableProps) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    const result = await deleteClassTemplate(id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const handleToggleStatus = async (id: string) => {
    const result = await toggleTemplateStatus(id)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  if (templates.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No hay plantillas creadas</p>
        <p className="text-sm text-muted-foreground mt-1">
          Crea tu primera plantilla para comenzar a generar clases automaticamente
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Clase</TableHead>
            <TableHead>Dia</TableHead>
            <TableHead>Horario</TableHead>
            <TableHead>Instructor</TableHead>
            <TableHead>Capacidad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{template.name}</div>
                  {template.class_type && (
                    <div className="text-sm text-muted-foreground">
                      {classTypeLabels[template.class_type] || template.class_type}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {dayOfWeekLabels[template.day_of_week]}
                </Badge>
              </TableCell>
              <TableCell>
                {template.start_time} - {template.end_time}
              </TableCell>
              <TableCell>
                {template.instructor_name || '-'}
              </TableCell>
              <TableCell>
                {template.max_capacity}
                {template.waitlist_enabled && (
                  <span className="text-muted-foreground text-sm"> (+espera)</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={template.is_active ? 'default' : 'secondary'}>
                  {template.is_active ? 'Activa' : 'Inactiva'}
                </Badge>
              </TableCell>
              <TableCell>
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/dashboard/templates/${template.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/dashboard/templates/${template.id}/edit`)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(template.id)}>
                        <Power className="mr-2 h-4 w-4" />
                        {template.is_active ? 'Desactivar' : 'Activar'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar plantilla</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta accion no se puede deshacer. Se eliminara la plantilla
                        <strong> {template.name}</strong>.
                        Las clases ya generadas no seran afectadas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(template.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
