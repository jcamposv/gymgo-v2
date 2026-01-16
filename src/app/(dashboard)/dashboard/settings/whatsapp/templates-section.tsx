'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Edit,
  FileText,
} from 'lucide-react'

import {
  getWhatsAppTemplates,
  createWhatsAppTemplate,
  deleteWhatsAppTemplate,
  syncTemplateStatus,
  sendTestWhatsAppMessage,
} from '@/actions/whatsapp.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TemplateStatusBadge } from '@/components/whatsapp/template-status-badge'
import { PhoneInput } from '@/components/whatsapp/phone-input'
import {
  TEMPLATE_TYPE_LABELS,
  type WhatsAppTemplateFormData,
} from '@/schemas/whatsapp.schema'
import type { WhatsAppTemplate, WhatsAppTemplateType } from '@/types/whatsapp.types'

export function TemplatesSection() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTestDialog, setShowTestDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(
    null
  )
  const [testPhone, setTestPhone] = useState('')
  const [sending, setSending] = useState(false)

  const fetchTemplates = async () => {
    setLoading(true)
    const { data, error } = await getWhatsAppTemplates()
    if (data) {
      setTemplates(data)
    } else if (error) {
      toast.error('Error al cargar plantillas')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleSync = async (templateId: string) => {
    const result = await syncTemplateStatus(templateId)
    if (result.success) {
      toast.success('Estado sincronizado')
      fetchTemplates()
    } else {
      toast.error(result.error || 'Error desconocido')
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Esta seguro de eliminar esta plantilla?')) return

    const result = await deleteWhatsAppTemplate(templateId)
    if (result.success) {
      toast.success('Plantilla eliminada')
      fetchTemplates()
    } else {
      toast.error(result.error || 'Error desconocido')
    }
  }

  const handleTestSend = async () => {
    if (!selectedTemplate || !testPhone) return

    setSending(true)
    const result = await sendTestWhatsAppMessage({
      template_id: selectedTemplate.id,
      phone_number: testPhone,
      variables: {
        '1': 'Juan Perez',
        '2': '3',
        '3': '$500.00 MXN',
        '4': 'Plan Mensual',
      },
    })

    if (result.success) {
      toast.success('Mensaje enviado')
      setShowTestDialog(false)
      setTestPhone('')
    } else {
      toast.error(result.error || 'Error desconocido')
    }
    setSending(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {templates.length} plantilla(s) registrada(s)
        </p>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva plantilla
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <CreateTemplateForm
              onSuccess={() => {
                setShowCreateDialog(false)
                fetchTemplates()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay plantillas creadas</p>
          <p className="text-sm text-muted-foreground">
            Crea una plantilla para comenzar a enviar mensajes
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Envios</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>
                  {TEMPLATE_TYPE_LABELS[template.template_type]}
                </TableCell>
                <TableCell>
                  <TemplateStatusBadge status={template.status} />
                </TableCell>
                <TableCell>{template.send_count}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSync(template.id)}
                      title="Sincronizar estado"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    {template.status === 'approved' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedTemplate(template)
                          setShowTestDialog(true)
                        }}
                        title="Enviar prueba"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(template.id)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Test Send Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar mensaje de prueba</DialogTitle>
            <DialogDescription>
              Envia un mensaje de prueba a tu telefono para verificar la plantilla
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm">
              <strong>Plantilla:</strong> {selectedTemplate?.name}
            </p>
            <PhoneInput
              value={testPhone}
              onChange={setTestPhone}
              label="Numero de telefono"
              placeholder="+52 55 1234 5678"
              required
            />
            <p className="text-xs text-muted-foreground">
              Se usaran variables de ejemplo en el mensaje
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleTestSend} disabled={sending || !testPhone}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar prueba
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// =============================================================================
// CREATE TEMPLATE FORM
// =============================================================================

interface CreateTemplateFormProps {
  onSuccess: () => void
}

function CreateTemplateForm({ onSuccess }: CreateTemplateFormProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<WhatsAppTemplateFormData>({
    name: '',
    template_type: 'payment_reminder',
    language: 'es',
    header_text: null,
    body_text: '',
    footer_text: null,
    variables: [],
    cta_buttons: [],
    is_default: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const result = await createWhatsAppTemplate(formData)

    if (result.success) {
      toast.success('Plantilla creada y enviada para aprobacion')
      onSuccess()
    } else {
      toast.error(result.error || 'Error desconocido')
    }

    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Nueva plantilla</DialogTitle>
        <DialogDescription>
          Crea una nueva plantilla de mensaje para WhatsApp
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Recordatorio de pago"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo *</Label>
            <Select
              value={formData.template_type}
              onValueChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  template_type: v as WhatsAppTemplateType,
                }))
              }
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TEMPLATE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="header">Encabezado (opcional)</Label>
          <Input
            id="header"
            value={formData.header_text || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                header_text: e.target.value || null,
              }))
            }
            placeholder="Recordatorio de pago"
            maxLength={60}
          />
          <p className="text-xs text-muted-foreground">Max 60 caracteres</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Mensaje *</Label>
          <Textarea
            id="body"
            value={formData.body_text}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, body_text: e.target.value }))
            }
            placeholder="Hola {{1}}, te recordamos que tu pago vence en {{2}} dias. Monto: {{3}} por el plan {{4}}."
            rows={4}
            required
            maxLength={1024}
          />
          <p className="text-xs text-muted-foreground">
            Usa {`{{1}}, {{2}}, etc.`} para variables. Max 1024 caracteres
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="footer">Pie de pagina (opcional)</Label>
          <Input
            id="footer"
            value={formData.footer_text || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                footer_text: e.target.value || null,
              }))
            }
            placeholder="Gimnasio XYZ"
            maxLength={60}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : (
            'Crear plantilla'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}
