'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Check, ChevronsUpDown, Dumbbell, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  benchmarkFormSchema,
  benchmarkUnitLabels,
  benchmarkUnits,
  type BenchmarkFormValues,
} from '@/schemas/benchmark.schema'
import { useExerciseOptions } from '@/hooks/use-member-benchmarks'
import type { BenchmarkFormData } from '@/types/benchmark.types'

// =============================================================================
// COMPONENT
// =============================================================================

interface BenchmarkFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberId: string
  onSubmit: (data: BenchmarkFormData) => Promise<{ success: boolean; error?: string }>
}

export function BenchmarkFormDialog({
  open,
  onOpenChange,
  memberId,
  onSubmit,
}: BenchmarkFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [exerciseComboboxOpen, setExerciseComboboxOpen] = useState(false)

  const { exercises, isLoading: exercisesLoading } = useExerciseOptions()

  const form = useForm<BenchmarkFormValues>({
    resolver: zodResolver(benchmarkFormSchema),
    defaultValues: {
      exercise_id: '',
      value: undefined,
      unit: 'kg',
      reps: null,
      sets: null,
      rpe: null,
      achieved_at: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    },
  })

  // Reset form and error when dialog opens/closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSubmitError(null)
      form.reset()
    }
    onOpenChange(isOpen)
  }

  const handleSubmit = async (data: BenchmarkFormValues) => {
    setLoading(true)
    setSubmitError(null)

    try {
      const processedData: BenchmarkFormData = {
        exercise_id: data.exercise_id,
        value: data.value,
        unit: data.unit,
        reps: data.reps ?? undefined,
        sets: data.sets ?? undefined,
        rpe: data.rpe ?? undefined,
        achieved_at: data.achieved_at,
        notes: data.notes ?? undefined,
      }

      const result = await onSubmit(processedData)

      if (result.success) {
        handleOpenChange(false)
      } else {
        setSubmitError(result.error ?? 'Error al guardar el PR')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar el PR'
      setSubmitError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Group exercises by category
  const exercisesByCategory = exercises.reduce(
    (acc, exercise) => {
      const category = exercise.category || 'Otros'
      if (!acc[category]) acc[category] = []
      acc[category].push(exercise)
      return acc
    },
    {} as Record<string, typeof exercises>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar PR / Benchmark</DialogTitle>
          <DialogDescription>
            Registra un nuevo récord personal para este miembro.
          </DialogDescription>
        </DialogHeader>

        {/* Error Alert */}
        {submitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Exercise Selection - Searchable Combobox */}
            <FormField
              control={form.control}
              name="exercise_id"
              render={({ field }) => {
                const selectedExercise = exercises.find((e) => e.id === field.value)
                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ejercicio *</FormLabel>
                    <Popover open={exerciseComboboxOpen} onOpenChange={setExerciseComboboxOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={exerciseComboboxOpen}
                            disabled={exercisesLoading}
                            className={cn(
                              'w-full justify-between font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {exercisesLoading ? (
                              <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cargando ejercicios...
                              </span>
                            ) : selectedExercise ? (
                              <span className="flex items-center gap-2 truncate">
                                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate">{selectedExercise.name}</span>
                                {selectedExercise.category && (
                                  <span className="text-xs text-muted-foreground">
                                    ({selectedExercise.category})
                                  </span>
                                )}
                              </span>
                            ) : (
                              'Buscar ejercicio...'
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar ejercicio por nombre..." />
                          <CommandList className="max-h-[300px]">
                            <CommandEmpty>No se encontraron ejercicios.</CommandEmpty>
                            {Object.entries(exercisesByCategory).map(([category, categoryExercises]) => (
                              <CommandGroup key={category} heading={category}>
                                {categoryExercises.map((exercise) => (
                                  <CommandItem
                                    key={exercise.id}
                                    value={`${exercise.name} ${exercise.category || ''}`}
                                    onSelect={() => {
                                      field.onChange(exercise.id)
                                      setExerciseComboboxOpen(false)
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Dumbbell className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span className="flex-1">{exercise.name}</span>
                                    <Check
                                      className={cn(
                                        'ml-auto h-4 w-4',
                                        field.value === exercise.id ? 'opacity-100' : 'opacity-0'
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            <Separator />

            {/* Value + Unit */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Ej: 100"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona unidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {benchmarkUnits.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {benchmarkUnitLabels[unit]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Reps + Sets */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repeticiones</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        placeholder="Ej: 5"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">Para RM (ej: 5RM = 5 reps)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rpe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RPE</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="1"
                        max="10"
                        placeholder="1-10"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">Esfuerzo percibido (1-10)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Date */}
            <FormField
              control={form.control}
              name="achieved_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionales sobre este PR..."
                      className="resize-none"
                      rows={2}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar PR
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
