'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  XCircle,
  Eye,
  Users,
  Clock,
  MapPin,
} from 'lucide-react'

import type { Tables } from '@/types/database.types'
import { deleteClass, cancelClass } from '@/actions/class.actions'

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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface ClassesTableProps {
  classes: Tables<'classes'>[]
}

const classTypeLabels: Record<string, string> = {
  crossfit: 'CrossFit',
  yoga: 'Yoga',
  pilates: 'Pilates',
  spinning: 'Spinning',
  hiit: 'HIIT',
  strength: 'Fuerza',
  cardio: 'Cardio',
  functional: 'Funcional',
  boxing: 'Box',
  mma: 'MMA',
  stretching: 'Estiramiento',
  open_gym: 'Open Gym',
  personal: 'Personal',
  other: 'Otro',
}

export function ClassesTable({ classes }: ClassesTableProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Tables<'classes'> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const handleDelete = async () => {
    if (!selectedClass) return

    setIsLoading(true)
    const result = await deleteClass(selectedClass.id)
    setIsLoading(false)

    if (result.success) {
      setDeleteDialogOpen(false)
      setSelectedClass(null)
    }
  }

  const handleCancel = async () => {
    if (!selectedClass) return

    setIsLoading(true)
    const formData = new FormData()
    formData.set('cancellation_reason', cancelReason)

    const result = await cancelClass(selectedClass.id, { success: false, message: '' }, formData)
    setIsLoading(false)

    if (result.success) {
      setCancelDialogOpen(false)
      setSelectedClass(null)
      setCancelReason('')
    }
  }

  const getOccupancy = (current: number, max: number) => {
    const percentage = (current / max) * 100
    if (percentage >= 90) return 'destructive'
    if (percentage >= 70) return 'secondary'
    return 'outline'
  }

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No hay clases programadas</p>
        <p className="text-sm text-muted-foreground mt-1">
          Crea tu primera clase para comenzar
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
              <TableHead className="w-[250px]">Clase</TableHead>
              <TableHead>Horario</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead>Capacidad</TableHead>
              <TableHead>Ubicacion</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((classItem) => (
              <TableRow key={classItem.id} className={classItem.is_cancelled ? 'opacity-50' : ''}>
                <TableCell>
                  <div>
                    <div className="font-medium">{classItem.name}</div>
                    {classItem.class_type && (
                      <Badge variant="outline" className="mt-1">
                        {classTypeLabels[classItem.class_type] ?? classItem.class_type}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {format(new Date(classItem.start_time), 'HH:mm', { locale: es })} - {format(new Date(classItem.end_time), 'HH:mm', { locale: es })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(classItem.start_time), 'EEEE d MMM', { locale: es })}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {classItem.instructor_name ?? 'Sin asignar'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Badge variant={getOccupancy(classItem.current_bookings, classItem.max_capacity)}>
                      {classItem.current_bookings}/{classItem.max_capacity}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {classItem.location && (
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3" />
                      {classItem.location}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {classItem.is_cancelled ? (
                    <Badge variant="destructive">Cancelada</Badge>
                  ) : new Date(classItem.start_time) < new Date() ? (
                    <Badge variant="secondary">Finalizada</Badge>
                  ) : (
                    <Badge variant="default">Activa</Badge>
                  )}
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
                        onClick={() => router.push(`/dashboard/classes/${classItem.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/dashboard/classes/${classItem.id}/edit`)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      {!classItem.is_cancelled && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedClass(classItem)
                              setCancelDialogOpen(true)
                            }}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancelar clase
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          setSelectedClass(classItem)
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

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar clase</DialogTitle>
            <DialogDescription>
              Esta accion eliminara permanentemente la clase{' '}
              <span className="font-semibold">{selectedClass?.name}</span> y todas
              las reservaciones asociadas. Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar clase</DialogTitle>
            <DialogDescription>
              Se notificara a todos los miembros con reservacion que la clase ha sido cancelada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel_reason">Razon de cancelacion (opcional)</Label>
              <Textarea
                id="cancel_reason"
                placeholder="Ej: Instructor enfermo, mantenimiento..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false)
                setCancelReason('')
              }}
              disabled={isLoading}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {isLoading ? 'Cancelando...' : 'Cancelar clase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
