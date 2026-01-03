'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import {
  getMemberNotes,
  getRecentNotes,
  createNote,
  type NoteFormData,
} from '@/actions/note.actions'
import type { MemberNote } from '@/types/member.types'

// =============================================================================
// MAIN HOOK: useMemberNotes
// =============================================================================

interface UseMemberNotesReturn {
  // Data
  notes: MemberNote[]
  recentNotes: MemberNote[]

  // Loading states
  isLoading: boolean
  isRefreshing: boolean
  isSubmitting: boolean

  // Error state
  error: string | null

  // Actions
  addNote: (data: NoteFormData) => Promise<{ success: boolean; error?: string }>
  refresh: () => Promise<void>
}

export function useMemberNotes(memberId: string): UseMemberNotesReturn {
  const [notes, setNotes] = useState<MemberNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Fetch notes on mount and when memberId changes
  const fetchNotes = useCallback(async () => {
    if (!memberId) {
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      const { data, error: fetchError } = await getMemberNotes(memberId)

      if (fetchError) {
        setError(fetchError)
        return
      }

      setNotes(data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las notas')
    } finally {
      setIsLoading(false)
    }
  }, [memberId])

  useEffect(() => {
    setIsLoading(true)
    fetchNotes()
  }, [fetchNotes])

  // Refresh notes (for manual refresh)
  const refresh = useCallback(async () => {
    await fetchNotes()
  }, [fetchNotes])

  // Add a new note
  const addNote = useCallback(
    async (data: NoteFormData): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await createNote(memberId, data)

        if (!result.success) {
          return { success: false, error: result.message }
        }

        const newNote = result.data as MemberNote

        // Update local state optimistically
        startTransition(() => {
          setNotes((prev) => {
            // Add new note at the beginning (most recent first)
            const updated = [newNote, ...prev]
            return updated.sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          })
        })

        return { success: true }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al crear la nota'
        return { success: false, error: errorMessage }
      }
    },
    [memberId]
  )

  // Get recent notes (first 3)
  const recentNotes = notes.slice(0, 3)

  return {
    notes,
    recentNotes,
    isLoading,
    isRefreshing: isPending,
    isSubmitting: isPending,
    error,
    addNote,
    refresh,
  }
}

// =============================================================================
// SIMPLER HOOK: Just for recent notes (if only that's needed)
// =============================================================================

interface UseRecentNotesReturn {
  recentNotes: MemberNote[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useRecentNotes(memberId: string, limit: number = 3): UseRecentNotesReturn {
  const [recentNotes, setRecentNotes] = useState<MemberNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRecent = useCallback(async () => {
    if (!memberId) {
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      const { data, error: fetchError } = await getRecentNotes(memberId, limit)

      if (fetchError) {
        setError(fetchError)
        return
      }

      setRecentNotes(data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las notas')
    } finally {
      setIsLoading(false)
    }
  }, [memberId, limit])

  useEffect(() => {
    setIsLoading(true)
    fetchRecent()
  }, [fetchRecent])

  const refresh = useCallback(async () => {
    await fetchRecent()
  }, [fetchRecent])

  return {
    recentNotes,
    isLoading,
    error,
    refresh,
  }
}
