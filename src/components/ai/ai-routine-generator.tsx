'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Sparkles, Dumbbell, AlertCircle, ArrowUpRight } from 'lucide-react'
import { z } from 'zod'

import { generateAIRoutine, type RoutineGenerationInput } from '@/actions/ai.actions'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'

// =============================================================================
// Constants
// =============================================================================

const GOALS = [
  { value: 'muscle_gain', label: 'Ganancia muscular', description: 'Hipertrofia y volumen' },
  { value: 'fat_loss', label: 'Pérdida de grasa', description: 'Cardio y circuitos' },
  { value: 'strength', label: 'Fuerza máxima', description: 'Levantamientos pesados' },
  { value: 'general', label: 'Acondicionamiento general', description: 'Fitness integral' },
  { value: 'endurance', label: 'Resistencia', description: 'Alta repeticiones' },
  { value: 'flexibility', label: 'Flexibilidad', description: 'Movilidad y estiramientos' },
] as const

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Principiante', description: '0-6 meses de experiencia' },
  { value: 'intermediate', label: 'Intermedio', description: '6 meses - 2 años' },
  { value: 'advanced', label: 'Avanzado', description: '2+ años de experiencia' },
] as const

const EQUIPMENT_OPTIONS = [
  'barbell',
  'dumbbell',
  'kettlebell',
  'cable',
  'machine',
  'bodyweight',
  'bench',
  'pull_up_bar',
  'bands',
  'trx',
]

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barra',
  dumbbell: 'Mancuernas',
  kettlebell: 'Kettlebell',
  cable: 'Poleas/Cable',
  machine: 'Máquinas',
  bodyweight: 'Peso corporal',
  bench: 'Banco',
  pull_up_bar: 'Barra de dominadas',
  bands: 'Bandas elásticas',
  trx: 'TRX/Suspensión',
}

// =============================================================================
// Schema
// =============================================================================

const formSchema = z.object({
  goal: z.enum(['muscle_gain', 'fat_loss', 'strength', 'general', 'endurance', 'flexibility']),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  daysPerWeek: z.number().int().min(1).max(7),
  sessionMinutes: z.number().int().min(15).max(180),
  equipment: z.array(z.string()).min(1, 'Selecciona al menos un tipo de equipo'),
  restrictions: z.string().max(500).optional(),
  preferences: z.string().max(500).optional(),
})

type FormData = z.infer<typeof formSchema>

// =============================================================================
// Component
// =============================================================================

interface AIRoutineGeneratorProps {
  memberId?: string
  memberName?: string
  trigger?: React.ReactNode
}

export function AIRoutineGenerator({
  memberId,
  memberName,
  trigger,
}: AIRoutineGeneratorProps) {
  const [open, setOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [limitError, setLimitError] = useState<{
    message: string
    upgrade_required: boolean
  } | null>(null)
  const router = useRouter()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goal: 'muscle_gain',
      experienceLevel: 'intermediate',
      daysPerWeek: 4,
      sessionMinutes: 60,
      equipment: ['barbell', 'dumbbell', 'machine', 'bodyweight'],
      restrictions: '',
      preferences: '',
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsGenerating(true)
    setLimitError(null)

    try {
      const input: RoutineGenerationInput = {
        memberId,
        memberName,
        goal: data.goal,
        daysPerWeek: data.daysPerWeek,
        sessionMinutes: data.sessionMinutes,
        equipment: data.equipment,
        restrictions: data.restrictions ? data.restrictions.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        experienceLevel: data.experienceLevel,
        preferences: data.preferences || undefined,
      }

      const result = await generateAIRoutine(input)

      if (result.success && result.data) {
        toast.success('Rutina generada exitosamente', {
          description: `${result.data.routineName} - ${result.data.tokensUsed} tokens usados`,
        })
        setOpen(false)
        router.push(`/dashboard/routines/${result.data.routineId}`)
      } else {
        // Check for limit error
        if (result.errors?.ai_limit) {
          setLimitError({
            message: result.message,
            upgrade_required: true,
          })
        } else {
          toast.error(result.message || 'Error al generar la rutina')
        }
      }
    } catch (error) {
      console.error('Error generating routine:', error)
      toast.error('Error al generar la rutina')
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleEquipment = (equipment: string) => {
    const current = form.getValues('equipment')
    const updated = current.includes(equipment)
      ? current.filter(e => e !== equipment)
      : [...current, equipment]
    form.setValue('equipment', updated, { shouldValidate: true })
  }

  const selectedEquipment = form.watch('equipment')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generar con AI
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generar Rutina con IA
          </DialogTitle>
          <DialogDescription>
            {memberName
              ? `Crea una rutina personalizada para ${memberName}`
              : 'Crea una plantilla de rutina personalizada con inteligencia artificial'}
          </DialogDescription>
        </DialogHeader>

        {limitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Límite alcanzado</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{limitError.message}</span>
              {limitError.upgrade_required && (
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/settings/billing">
                    Ver planes
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Goal Selection */}
            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objetivo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un objetivo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GOALS.map((goal) => (
                        <SelectItem key={goal.value} value={goal.value}>
                          <div className="flex flex-col">
                            <span>{goal.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {goal.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Experience Level */}
            <FormField
              control={form.control}
              name="experienceLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nivel de experiencia</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el nivel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXPERIENCE_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex flex-col">
                            <span>{level.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {level.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Days per Week & Session Duration */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="daysPerWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Días por semana: {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={7}
                        step={1}
                        value={[field.value]}
                        onValueChange={(v) => field.onChange(v[0])}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Cuántos días entrenará por semana
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sessionMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración: {field.value} minutos</FormLabel>
                    <FormControl>
                      <Slider
                        min={15}
                        max={120}
                        step={15}
                        value={[field.value]}
                        onValueChange={(v) => field.onChange(v[0])}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Duración de cada sesión
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Equipment Selection */}
            <FormField
              control={form.control}
              name="equipment"
              render={() => (
                <FormItem>
                  <FormLabel>Equipo disponible</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {EQUIPMENT_OPTIONS.map((eq) => (
                      <Badge
                        key={eq}
                        variant={selectedEquipment.includes(eq) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleEquipment(eq)}
                      >
                        {EQUIPMENT_LABELS[eq] || eq}
                      </Badge>
                    ))}
                  </div>
                  <FormDescription className="text-xs">
                    Selecciona el equipo disponible en tu gimnasio
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Restrictions */}
            <FormField
              control={form.control}
              name="restrictions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Restricciones o lesiones</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: dolor de rodilla, lesión de hombro"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Separa múltiples restricciones con comas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preferences */}
            <FormField
              control={form.control}
              name="preferences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferencias adicionales</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: prefiero ejercicios compuestos, no me gustan las máquinas..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isGenerating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isGenerating || !!limitError}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generar rutina
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
