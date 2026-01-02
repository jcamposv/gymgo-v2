'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Calendar, Check, AlertCircle } from 'lucide-react'

import {
  previewClassGeneration,
  generateClassesFromTemplates,
} from '@/actions/template.actions'
import { dayOfWeekLabels } from '@/schemas/template.schema'
import type { GenerateClassesParams } from '@/schemas/template.schema'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'

interface GeneratePreview {
  template: {
    id: string
    name: string
    day_of_week: number
    start_time: string
    class_type: string | null
  }
  dates: string[]
  alreadyGenerated: string[]
  toGenerate: string[]
}

interface GenerateClassesDialogProps {
  disabled?: boolean
}

const periodLabels: Record<string, string> = {
  week: '1 semana',
  two_weeks: '2 semanas',
  month: '1 mes',
}

export function GenerateClassesDialog({ disabled }: GenerateClassesDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [period, setPeriod] = useState<GenerateClassesParams['period']>('week')
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [preview, setPreview] = useState<GeneratePreview[] | null>(null)
  const [totalToGenerate, setTotalToGenerate] = useState(0)

  const handlePreview = async () => {
    setIsLoading(true)
    setPreview(null)

    const result = await previewClassGeneration({ period })

    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    setPreview(result.data as GeneratePreview[] | null)
    setTotalToGenerate(result.totalToGenerate)
  }

  const handleGenerate = async () => {
    setIsGenerating(true)

    const result = await generateClassesFromTemplates({ period })

    setIsGenerating(false)

    if (result.success) {
      toast.success(result.message)
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach((err) => toast.error(err))
      }
      setOpen(false)
      setPreview(null)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) {
        setPreview(null)
      }
    }}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Calendar className="mr-2 h-4 w-4" />
          Generar clases
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Generar clases</DialogTitle>
          <DialogDescription>
            Genera clases automaticamente a partir de las plantillas activas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Periodo de generacion</Label>
            <Select
              value={period}
              onValueChange={(value) => {
                setPeriod(value as GenerateClassesParams['period'])
                setPreview(null)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Proxima semana (7 dias)</SelectItem>
                <SelectItem value="two_weeks">Proximas 2 semanas (14 dias)</SelectItem>
                <SelectItem value="month">Proximo mes (30 dias)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!preview && (
            <Button
              onClick={handlePreview}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculando...
                </>
              ) : (
                'Ver vista previa'
              )}
            </Button>
          )}

          {preview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Vista previa</h4>
                <Badge variant="outline">
                  {totalToGenerate} clases a generar
                </Badge>
              </div>

              {totalToGenerate === 0 ? (
                <div className="border rounded-lg p-4 text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No hay clases nuevas para generar en este periodo
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Las clases ya fueron generadas previamente
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] border rounded-lg">
                  <div className="p-4 space-y-4">
                    {preview.map((item) => (
                      <div key={item.template.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{item.template.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {dayOfWeekLabels[item.template.day_of_week]} - {item.template.start_time}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {item.toGenerate.length} nuevas
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.dates.map((date) => {
                            const isNew = item.toGenerate.includes(date)
                            return (
                              <Badge
                                key={date}
                                variant={isNew ? 'default' : 'outline'}
                                className={`text-xs ${!isNew ? 'opacity-50' : ''}`}
                              >
                                {isNew && <Check className="mr-1 h-3 w-3" />}
                                {formatDate(date)}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          {preview && totalToGenerate > 0 && (
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                `Generar ${totalToGenerate} clases`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
