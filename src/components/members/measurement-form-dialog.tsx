'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, Loader2, Info } from 'lucide-react'
import { format } from 'date-fns'

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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  measurementFormLabels,
  measurementValidation,
  measurementsCardLabels,
} from '@/lib/i18n'
import type { MeasurementFormData } from '@/types/member.types'
import { calculateBMI } from '@/hooks/use-member-measurements'

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const measurementSchema = z.object({
  measured_at: z.string().min(1, measurementValidation.dateRequired),
  // Core body measurements
  height_cm: z.string().optional().refine(
    (val) => !val || (parseFloat(val) > 0 && parseFloat(val) <= 300),
    { message: measurementValidation.heightRange }
  ),
  weight_kg: z.string().optional().refine(
    (val) => !val || (parseFloat(val) > 0 && parseFloat(val) <= 500),
    { message: measurementValidation.weightRange }
  ),
  // Body composition
  body_fat_percentage: z.string().optional().refine(
    (val) => !val || (parseFloat(val) >= 3 && parseFloat(val) <= 70),
    { message: measurementValidation.bodyFatRange }
  ),
  muscle_mass_kg: z.string().optional().refine(
    (val) => !val || (parseFloat(val) > 0 && parseFloat(val) <= 200),
    { message: measurementValidation.muscleMassRange }
  ),
  // Circumference measurements
  waist_cm: z.string().optional().refine(
    (val) => !val || (parseFloat(val) > 0 && parseFloat(val) <= 300),
    { message: measurementValidation.waistRange }
  ),
  hip_cm: z.string().optional().refine(
    (val) => !val || (parseFloat(val) > 0 && parseFloat(val) <= 300),
    { message: measurementValidation.hipRange }
  ),
  notes: z.string().optional(),
})

type MeasurementFormValues = z.infer<typeof measurementSchema>

// Helper to convert string to number or undefined
function toNumber(value: string | undefined): number | undefined {
  if (!value || value === '') return undefined
  const num = parseFloat(value)
  return isNaN(num) ? undefined : num
}

// =============================================================================
// COMPONENT
// =============================================================================

interface MeasurementFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberId: string
  onSubmit: (data: MeasurementFormData) => Promise<void>
}

export function MeasurementFormDialog({
  open,
  onOpenChange,
  memberId,
  onSubmit,
}: MeasurementFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<MeasurementFormValues>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      measured_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    },
  })

  // Watch height and weight for BMI preview
  const heightCm = form.watch('height_cm')
  const weightKg = form.watch('weight_kg')
  const previewBMI = calculateBMI(toNumber(heightCm), toNumber(weightKg))

  // Reset form and error when dialog opens/closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSubmitError(null)
      form.reset()
    }
    onOpenChange(isOpen)
  }

  const handleSubmit = async (data: MeasurementFormValues) => {
    setLoading(true)
    setSubmitError(null)

    try {
      // Convert string values to numbers
      const processedData: MeasurementFormData = {
        measured_at: data.measured_at,
        height_cm: toNumber(data.height_cm),
        weight_kg: toNumber(data.weight_kg),
        body_fat_percentage: toNumber(data.body_fat_percentage),
        muscle_mass_kg: toNumber(data.muscle_mass_kg),
        waist_cm: toNumber(data.waist_cm),
        hip_cm: toNumber(data.hip_cm),
        notes: data.notes,
      }

      await onSubmit(processedData)
      // If successful, the parent will close the dialog
      form.reset()
    } catch (err) {
      // Show error in dialog - parent should throw error on failure
      const errorMessage = err instanceof Error ? err.message : 'Failed to save measurement'
      setSubmitError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{measurementFormLabels.title}</DialogTitle>
          <DialogDescription>
            {measurementFormLabels.description}
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
            {/* Date */}
            <FormField
              control={form.control}
              name="measured_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{measurementFormLabels.measurementDate}</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Core Body Measurements */}
            <div>
              <h4 className="text-sm font-medium mb-4">{measurementFormLabels.bodyMeasurementsSection}</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="height_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{measurementFormLabels.heightCm}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder={measurementFormLabels.heightPlaceholder} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weight_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{measurementFormLabels.weightKg}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder={measurementFormLabels.weightPlaceholder} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* BMI Preview */}
              {previewBMI && (
                <div className="mt-3 p-3 bg-muted rounded-lg flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {measurementFormLabels.calculatedBmi}: <strong>{previewBMI}</strong>
                    {previewBMI < 18.5 && ` (${measurementsCardLabels.bmiUnderweight})`}
                    {previewBMI >= 18.5 && previewBMI < 25 && ` (${measurementsCardLabels.bmiNormal})`}
                    {previewBMI >= 25 && previewBMI < 30 && ` (${measurementsCardLabels.bmiOverweight})`}
                    {previewBMI >= 30 && ` (${measurementsCardLabels.bmiObese})`}
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* Body Composition */}
            <div>
              <h4 className="text-sm font-medium mb-4">{measurementFormLabels.bodyCompositionSection}</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="body_fat_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{measurementFormLabels.bodyFatPercentage}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder={measurementFormLabels.bodyFatPlaceholder} {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">{measurementFormLabels.bodyFatRange}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="muscle_mass_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{measurementFormLabels.muscleMassKg}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder={measurementFormLabels.muscleMassPlaceholder} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Circumference Measurements */}
            <div>
              <h4 className="text-sm font-medium mb-4">{measurementFormLabels.circumferenceSection}</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="waist_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{measurementFormLabels.waistCm}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder={measurementFormLabels.waistPlaceholder} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hip_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{measurementFormLabels.hipCm}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder={measurementFormLabels.hipPlaceholder} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{measurementFormLabels.notes}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={measurementFormLabels.notesPlaceholder}
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                {measurementFormLabels.cancel}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {measurementFormLabels.save}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
