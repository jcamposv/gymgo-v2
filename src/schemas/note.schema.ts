import { z } from 'zod'

// =============================================================================
// NOTE TYPE OPTIONS
// =============================================================================

export const noteTypes = [
  'notes',
  'trainer_comments',
  'progress',
  'medical',
  'general',
] as const

export type NoteTypeValue = (typeof noteTypes)[number]

export const noteTypeLabels: Record<NoteTypeValue, string> = {
  notes: 'Nota general',
  trainer_comments: 'Comentario del entrenador',
  progress: 'Progreso',
  medical: 'Médico',
  general: 'General',
}

// =============================================================================
// NOTE FORM SCHEMA
// =============================================================================

export const noteFormSchema = z.object({
  type: z.enum(noteTypes),
  title: z
    .string()
    .min(1, 'El título es obligatorio')
    .max(200, 'El título no puede exceder 200 caracteres'),
  content: z
    .string()
    .min(10, 'La nota es muy corta, agrega un poco más de detalle')
    .max(5000, 'El contenido no puede exceder 5000 caracteres'),
})

export type NoteFormValues = z.infer<typeof noteFormSchema>

// =============================================================================
// DEFAULT VALUES
// =============================================================================

export const defaultNoteFormValues: NoteFormValues = {
  type: 'trainer_comments',
  title: '',
  content: '',
}
