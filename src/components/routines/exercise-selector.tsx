'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Plus, Loader2 } from 'lucide-react'

import { getExercises } from '@/actions/exercise.actions'
import {
  categoryLabels,
  difficultyLabels,
  muscleGroupLabels,
} from '@/schemas/exercise.schema'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

interface Exercise {
  id: string
  name: string
  category: string | null
  muscle_groups: string[] | null
  difficulty: string | null
  gif_url: string | null
  thumbnail_url: string | null
  video_url: string | null
  is_global: boolean | null
}

// Get the best available thumbnail for an exercise
function getExerciseThumbnail(exercise: Exercise): string | null {
  return exercise.thumbnail_url || exercise.gif_url || exercise.video_url || null
}

interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise) => void
  selectedIds?: string[]
  trigger?: React.ReactNode
}

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2
const PAGE_SIZE = 30

export function ExerciseSelector({ onSelect, selectedIds = [], trigger }: ExerciseSelectorProps) {
  const [open, setOpen] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [category, setCategory] = useState<string>('all')

  // Track current request to ignore stale responses
  const requestIdRef = useRef(0)

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only search if query meets minimum length or is empty (show default list)
      if (inputValue.length >= MIN_QUERY_LENGTH || inputValue.length === 0) {
        setDebouncedQuery(inputValue)
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [inputValue])

  // Fetch exercises when debounced query or category changes
  useEffect(() => {
    if (!open) return

    const currentRequestId = ++requestIdRef.current

    const loadExercises = async () => {
      setLoading(true)

      const { data } = await getExercises({
        query: debouncedQuery || undefined,
        category: category === 'all' ? undefined : category,
        is_active: true,
        include_global: true,
        page: 1,
        per_page: PAGE_SIZE,
      })

      // Only update state if this is still the latest request
      if (currentRequestId === requestIdRef.current) {
        setExercises(data || [])
        setLoading(false)
      }
    }

    loadExercises()
  }, [open, debouncedQuery, category])

  // Reset state when dialog closes
  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setInputValue('')
      setDebouncedQuery('')
      setCategory('all')
      setExercises([])
    }
  }, [])

  const handleSelect = useCallback((exercise: Exercise) => {
    onSelect(exercise)
    handleOpenChange(false)
  }, [onSelect, handleOpenChange])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Agregar ejercicio
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Seleccionar ejercicio</DialogTitle>
          <DialogDescription>
            Busca y selecciona un ejercicio para agregar a la rutina
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar ejercicios..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="pl-9 pr-9"
              autoFocus
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[350px] sm:h-[400px]">
          {loading && exercises.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : inputValue.length > 0 && inputValue.length < MIN_QUERY_LENGTH ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground text-center px-4">
                Escribe al menos {MIN_QUERY_LENGTH} caracteres para buscar
              </p>
            </div>
          ) : exercises.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">
                {debouncedQuery ? 'No se encontraron ejercicios' : 'Cargando ejercicios...'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 pr-4">
              {exercises.map((exercise) => {
                const isSelected = selectedIds.includes(exercise.id)
                const thumbnail = getExerciseThumbnail(exercise)
                const isVideo = thumbnail && thumbnail === exercise.video_url

                return (
                  <div
                    key={exercise.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                      isSelected ? 'border-primary bg-primary/5 cursor-default' : ''
                    }`}
                    onClick={() => !isSelected && handleSelect(exercise)}
                  >
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                      {thumbnail ? (
                        isVideo ? (
                          <video
                            src={thumbnail}
                            className="w-12 h-12 object-cover rounded bg-muted"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={thumbnail}
                            alt={exercise.name}
                            className="w-12 h-12 object-cover rounded bg-muted"
                          />
                        )
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">N/A</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="font-medium truncate text-sm sm:text-base">
                        {exercise.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {exercise.category && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0">
                            {categoryLabels[exercise.category] || exercise.category}
                          </Badge>
                        )}
                        {exercise.difficulty && (
                          <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0 hidden sm:inline-flex">
                            {difficultyLabels[exercise.difficulty] || exercise.difficulty}
                          </Badge>
                        )}
                        {exercise.muscle_groups?.slice(0, 1).map((muscle) => (
                          <Badge key={muscle} variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0">
                            {muscleGroupLabels[muscle] || muscle}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <Badge className="text-xs">Agregado</Badge>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
