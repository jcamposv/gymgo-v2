'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Bell, Clock } from 'lucide-react'

import { updateWhatsAppSettings } from '@/actions/whatsapp.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { GymWhatsAppSettings } from '@/types/whatsapp.types'

interface SettingsFormProps {
  initialData: GymWhatsAppSettings
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    is_enabled: initialData.is_enabled,
    reminder_days_before: initialData.reminder_days_before,
    reminder_hour: initialData.reminder_hour,
    auto_opt_in_new_members: initialData.auto_opt_in_new_members,
    send_payment_confirmation: initialData.send_payment_confirmation,
    send_membership_expiry_warning: initialData.send_membership_expiry_warning,
  })

  const handleToggle = (field: string) => {
    setFormData((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const handleReminderDaysChange = (index: number, value: string) => {
    const newDays = [...formData.reminder_days_before]
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 30) {
      newDays[index] = numValue
      setFormData((prev) => ({ ...prev, reminder_days_before: newDays }))
    }
  }

  const addReminderDay = () => {
    if (formData.reminder_days_before.length < 5) {
      setFormData((prev) => ({
        ...prev,
        reminder_days_before: [...prev.reminder_days_before, 0],
      }))
    }
  }

  const removeReminderDay = (index: number) => {
    if (formData.reminder_days_before.length > 1) {
      const newDays = formData.reminder_days_before.filter((_, i) => i !== index)
      setFormData((prev) => ({ ...prev, reminder_days_before: newDays }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const result = await updateWhatsAppSettings(formData)

    if (result.success) {
      toast.success('Configuracion actualizada')
      router.refresh()
    } else {
      toast.error(result.error || 'Error al guardar')
    }

    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Enable/Disable */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Habilitar notificaciones por WhatsApp</Label>
          <p className="text-sm text-muted-foreground">
            Activa o desactiva el envio de mensajes automaticos a tus miembros
          </p>
        </div>
        <Switch
          checked={formData.is_enabled}
          onCheckedChange={() => handleToggle('is_enabled')}
        />
      </div>

      <Separator />

      {/* Reminder Schedule */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <h3 className="text-lg font-medium">Horario de recordatorios</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Hora de envio</Label>
            <Select
              value={formData.reminder_hour.toString()}
              onValueChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  reminder_hour: parseInt(v, 10),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {i.toString().padStart(2, '0')}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Los recordatorios se enviaran a esta hora
            </p>
          </div>

          <div className="space-y-2">
            <Label>Dias antes del vencimiento</Label>
            <div className="flex flex-wrap gap-2">
              {formData.reminder_days_before.map((day, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    max="30"
                    value={day}
                    onChange={(e) =>
                      handleReminderDaysChange(index, e.target.value)
                    }
                    className="w-16"
                  />
                  {formData.reminder_days_before.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeReminderDay(index)}
                    >
                      x
                    </Button>
                  )}
                </div>
              ))}
              {formData.reminder_days_before.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addReminderDay}
                >
                  + Agregar
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Ej: 3, 1, 0 = 3 dias antes, 1 dia antes, y el dia de vencimiento
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Notification Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="text-lg font-medium">Tipos de notificaciones</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Confirmacion de pago</Label>
              <p className="text-sm text-muted-foreground">
                Enviar mensaje cuando se registre un pago
              </p>
            </div>
            <Switch
              checked={formData.send_payment_confirmation}
              onCheckedChange={() => handleToggle('send_payment_confirmation')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Aviso de vencimiento de membresia</Label>
              <p className="text-sm text-muted-foreground">
                Enviar recordatorio cuando la membresia este por vencer
              </p>
            </div>
            <Switch
              checked={formData.send_membership_expiry_warning}
              onCheckedChange={() =>
                handleToggle('send_membership_expiry_warning')
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Opt-in automatico para nuevos miembros</Label>
              <p className="text-sm text-muted-foreground">
                Los nuevos miembros recibiran mensajes automaticamente
              </p>
            </div>
            <Switch
              checked={formData.auto_opt_in_new_members}
              onCheckedChange={() => handleToggle('auto_opt_in_new_members')}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </div>
    </form>
  )
}
