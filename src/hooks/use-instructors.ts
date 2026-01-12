'use client'

import { useEffect, useState, useCallback } from 'react'
import { getInstructors, type Instructor } from '@/actions/instructor.actions'

interface InstructorsState {
  instructors: Instructor[]
  loading: boolean
  error: string | null
}

export function useInstructors() {
  const [state, setState] = useState<InstructorsState>({
    instructors: [],
    loading: true,
    error: null,
  })

  const fetchInstructors = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    const result = await getInstructors()

    if (result.error) {
      setState({
        instructors: [],
        loading: false,
        error: result.error,
      })
    } else {
      setState({
        instructors: result.data || [],
        loading: false,
        error: null,
      })
    }
  }, [])

  useEffect(() => {
    fetchInstructors()
  }, [fetchInstructors])

  return {
    instructors: state.instructors,
    loading: state.loading,
    error: state.error,
    refetch: fetchInstructors,
  }
}

/**
 * Get instructor name from ID
 * Useful for display in tables/detail views
 */
export function useInstructorName(instructorId: string | null | undefined) {
  const { instructors, loading } = useInstructors()

  if (!instructorId || loading) {
    return { name: null, loading }
  }

  const instructor = instructors.find(i => i.id === instructorId)
  return {
    name: instructor?.full_name || null,
    instructor,
    loading,
  }
}
