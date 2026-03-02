'use client'

import { ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useBilling } from './billing-provider'

export function BillingHistoryTable() {
  const { billingHistory } = useBilling()

  const statusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default">Pagado</Badge>
      case 'failed':
        return <Badge variant="destructive">Fallido</Badge>
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>
      case 'refunded':
        return <Badge variant="outline">Reembolsado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (billingHistory.records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historial de facturacion</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No hay registros de facturacion aun.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historial de facturacion</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Fecha</th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Descripcion</th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground">Monto</th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground">Estado</th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground">Factura</th>
              </tr>
            </thead>
            <tbody>
              {billingHistory.records.map((record) => (
                <tr key={record.id} className="border-b last:border-0">
                  <td className="py-2 px-2">
                    {new Date(record.created_at).toLocaleDateString('es-MX')}
                  </td>
                  <td className="py-2 px-2 text-muted-foreground">
                    {record.description || 'Pago de suscripcion'}
                  </td>
                  <td className="py-2 px-2 text-right font-medium">
                    ${(record.amount_cents / 100).toFixed(2)} {record.currency.toUpperCase()}
                  </td>
                  <td className="py-2 px-2 text-center">
                    {statusBadge(record.status)}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {record.invoice_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={record.invoice_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
