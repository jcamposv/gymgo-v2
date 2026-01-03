'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Loader2 } from 'lucide-react'

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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { noteFormLabels, noteTypeLabels } from '@/lib/i18n'
import { noteFormSchema, noteTypes, type NoteFormValues } from '@/schemas/note.schema'
import type { NoteFormData } from '@/actions/note.actions'

// =============================================================================
// COMPONENT
// =============================================================================

interface NoteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberId: string
  onSubmit: (data: NoteFormData) => Promise<{ success: boolean; error?: string }>
}

export function NoteFormDialog({
  open,
  onOpenChange,
  memberId,
  onSubmit,
}: NoteFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      type: 'trainer_comments',
      title: '',
      content: '',
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

  const handleSubmit = async (data: NoteFormValues) => {
    setLoading(true)
    setSubmitError(null)

    try {
      const result = await onSubmit(data)

      if (result.success) {
        form.reset()
        onOpenChange(false)
      } else {
        setSubmitError(result.error || 'Error al guardar la nota')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar la nota'
      setSubmitError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{noteFormLabels.title}</DialogTitle>
          <DialogDescription>
            {noteFormLabels.description}
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
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Note Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{noteFormLabels.noteType}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {noteTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {noteTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{noteFormLabels.noteTitle}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={noteFormLabels.noteTitlePlaceholder}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{noteFormLabels.noteContent}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={noteFormLabels.noteContentPlaceholder}
                      className="resize-none"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                {noteFormLabels.cancel}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? noteFormLabels.saving : noteFormLabels.save}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
