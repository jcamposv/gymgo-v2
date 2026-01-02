'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, X } from 'lucide-react'

import { getExercises } from '@/actions/exercise.actions'
import {
  categoryLabels,
  difficultyLabels,
  muscleGroupLabels,
} from '@/schemas/exercise.schema'
import type { ExerciseItem } from '@/schemas/routine.schema'

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
  difficulty: string
  gif_url: string | null
  is_global: boolean
}

interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise) => void
  selectedIds?: string[]
  trigger?: React.ReactNode
}

export function ExerciseSelector({ onSelect, selectedIds = [], trigger }: ExerciseSelectorProps) {
  const [open, setOpen] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('')

  useEffect(() => {
    if (open) {
      loadExercises()
    }
  }, [open, query, category])

  const loadExercises = async () => {
    setLoading(true)
    const { data } = await getExercises({
      query: query || undefined,
      category: category || undefined,
      is_active: true,
      include_global: true,
      page: 1,
      per_page: 50,
    })
    setExercises(data || [])
    setLoading(false)
  }

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Agregar ejercicio
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Seleccionar ejercicio</DialogTitle>
          <DialogDescription>
            Busca y selecciona un ejercicio para agregar a la rutina
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar ejercicios..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          ) : exercises.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No se encontraron ejercicios</p>
            </div>
          ) : (
            <div className="space-y-2">
              {exercises.map((exercise) => {
                const isSelected = selectedIds.includes(exercise.id)
                return (
                  <div
                    key={exercise.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => !isSelected && handleSelect(exercise)}
                  >
                    {exercise.gif_url ? (
                      <img
                        src={exercise.gif_url}
                        alt={exercise.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">N/A</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{exercise.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {exercise.category && (
                          <Badge variant="outline" className="text-xs">
                            {categoryLabels[exercise.category] || exercise.category}
                          </Badge>
                        )}
                        <Badge
                          variant="secondary"
                          className="text-xs"
                        >
                          {difficultyLabels[exercise.difficulty] || exercise.difficulty}
                        </Badge>
                        {exercise.muscle_groups?.slice(0, 2).map((muscle) => (
                          <Badge key={muscle} variant="secondary" className="text-xs">
                            {muscleGroupLabels[muscle] || muscle}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {isSelected ? (
                      <Badge>Agregado</Badge>
                    ) : (
                      <Button size="sm" variant="ghost">
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
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
