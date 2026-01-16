'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, RefreshCw, Filter, Inbox } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { getDeliveryLogs } from '@/actions/whatsapp.actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DELIVERY_STATUS_LABELS,
  NOTIFICATION_CHANNEL_LABELS,
} from '@/schemas/whatsapp.schema'
import type {
  NotificationDeliveryLog,
  NotificationDeliveryStatus,
  NotificationChannel,
  DeliveryLogFilters,
} from '@/types/whatsapp.types'

const statusVariants: Record<
  NotificationDeliveryStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'secondary',
  queued: 'outline',
  sent: 'outline',
  delivered: 'default',
  read: 'default',
  failed: 'destructive',
  undelivered: 'destructive',
}

export function DeliveryLogSection() {
  const [logs, setLogs] = useState<NotificationDeliveryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<DeliveryLogFilters>({
    page: 1,
    limit: 20,
  })
  const [total, setTotal] = useState(0)

  const fetchLogs = async () => {
    setLoading(true)
    const { data, error, total: totalCount } = await getDeliveryLogs(filters)
    if (data) {
      setLogs(data)
      setTotal(totalCount || 0)
    } else if (error) {
      toast.error('Error al cargar historial')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()
  }, [filters])

  const handleFilterChange = (
    key: keyof DeliveryLogFilters,
    value: string | undefined
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: 1, // Reset page on filter change
    }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }

  const totalPages = Math.ceil(total / (filters.limit || 20))

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtros:</span>
        </div>

        <Select
          value={filters.channel || 'all'}
          onValueChange={(v) =>
            handleFilterChange('channel', v as NotificationChannel | undefined)
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los canales</SelectItem>
            {Object.entries(NOTIFICATION_CHANNEL_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status || 'all'}
          onValueChange={(v) =>
            handleFilterChange(
              'status',
              v as NotificationDeliveryStatus | undefined
            )
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(DELIVERY_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" onClick={fetchLogs}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay registros de envios</p>
          <p className="text-sm text-muted-foreground">
            Los mensajes enviados apareceran aqui
          </p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Destinatario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', {
                      locale: es,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {NOTIFICATION_CHANNEL_LABELS[log.channel]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.notification_type.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {log.recipient_phone || log.recipient_email || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[log.status]}>
                      {DELIVERY_STATUS_LABELS[log.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {log.error_message || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {logs.length} de {total} registros
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page! - 1)}
                  disabled={filters.page === 1}
                >
                  Anterior
                </Button>
                <span className="flex items-center text-sm">
                  Pagina {filters.page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page! + 1)}
                  disabled={filters.page === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
