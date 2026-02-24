'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Plus, X, Image as ImageIcon, Link as LinkIcon, Upload } from 'lucide-react'

import { createExerciseData, updateExerciseData } from '@/actions/exercise.actions'
import {
  exerciseSchema,
  categories,
  difficulties,
  muscleGroups,
  equipmentOptions,
  type ExerciseFormData,
} from '@/schemas/exercise.schema'
import { useOrganization } from '@/hooks'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ImageUpload } from '@/components/shared/image-upload'

interface Exercise {
  id: string
  name: string
  name_es: string | null
  name_en: string | null
  description: string | null
  category: string | null
  muscle_groups: string[] | null
  equipment: string[] | null
  difficulty: string | null
  video_url: string | null
  gif_url: string | null
  thumbnail_url: string | null
  instructions: string[] | null
  tips: string[] | null
  common_mistakes: string[] | null
  is_global: boolean | null
  is_active: boolean | null
}

interface ExerciseFormProps {
  exercise?: Exercise
  mode: 'create' | 'edit'
}

export function ExerciseForm({ exercise, mode }: ExerciseFormProps) {
  const router = useRouter()
  const { organizationId } = useOrganization()
  const [newInstruction, setNewInstruction] = useState('')
  const [newTip, setNewTip] = useState('')
  const [newMistake, setNewMistake] = useState('')
  const [mediaMode, setMediaMode] = useState<'upload' | 'url'>('url')

  const form = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      name: exercise?.name ?? '',
      name_es: exercise?.name_es ?? '',
      name_en: exercise?.name_en ?? '',
      description: exercise?.description ?? '',
      category: exercise?.category ?? null,
      muscle_groups: exercise?.muscle_groups ?? [],
      equipment: exercise?.equipment ?? [],
      difficulty: (exercise?.difficulty as 'beginner' | 'intermediate' | 'advanced') ?? 'intermediate',
      video_url: exercise?.video_url ?? '',
      gif_url: exercise?.gif_url ?? '',
      thumbnail_url: exercise?.thumbnail_url ?? '',
      instructions: exercise?.instructions ?? [],
      tips: exercise?.tips ?? [],
      common_mistakes: exercise?.common_mistakes ?? [],
      is_global: exercise?.is_global ?? false,
      is_active: exercise?.is_active ?? true,
    },
  })

  const onSubmit = async (data: ExerciseFormData) => {
    try {
      const result = mode === 'create'
        ? await createExerciseData(data)
        : await updateExerciseData(exercise!.id, data)

      if (result.success) {
        toast.success(result.message)
        router.push('/dashboard/exercises')
      } else {
        toast.error(result.message)
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, errors]) => {
            form.setError(field as keyof ExerciseFormData, {
              message: errors[0],
            })
          })
        }
      }
    } catch {
      toast.error('Error al guardar el ejercicio')
    }
  }

  const addArrayItem = (fieldName: 'instructions' | 'tips' | 'common_mistakes', value: string, setValue: (v: string) => void) => {
    if (!value.trim()) return
    const currentValues = form.getValues(fieldName) || []
    form.setValue(fieldName, [...currentValues, value.trim()])
    setValue('')
  }

  const removeArrayItem = (fieldName: 'instructions' | 'tips' | 'common_mistakes', index: number) => {
    const currentValues = form.getValues(fieldName) || []
    form.setValue(fieldName, currentValues.filter((_, i) => i !== index))
  }

  const toggleMultiSelect = (
    fieldName: 'muscle_groups' | 'equipment',
    value: string
  ) => {
    const currentValues = form.getValues(fieldName) || []
    if (currentValues.includes(value)) {
      form.setValue(fieldName, currentValues.filter(v => v !== value))
    } else {
      form.setValue(fieldName, [...currentValues, value])
    }
  }

  const watchedMuscleGroups = form.watch('muscle_groups') || []
  const watchedEquipment = form.watch('equipment') || []
  const watchedInstructions = form.watch('instructions') || []
  const watchedTips = form.watch('tips') || []
  const watchedMistakes = form.watch('common_mistakes') || []
  const watchedGifUrl = form.watch('gif_url')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informacion basica</CardTitle>
                <CardDescription>
                  Nombre y clasificacion del ejercicio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Press de banca" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name_es"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre en espanol</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nombre alternativo"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre en ingles</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="English name"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dificultad *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {difficulties.map((diff) => (
                              <SelectItem key={diff.value} value={diff.value}>
                                {diff.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripcion</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripcion del ejercicio..."
                          rows={3}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Activo</FormLabel>
                        <FormDescription className="text-xs">
                          Disponible para usar en rutinas
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
                <CardDescription>
                  GIF o video demostrativo del ejercicio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={mediaMode} onValueChange={(v) => setMediaMode(v as 'upload' | 'url')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Subir archivo
                    </TabsTrigger>
                    <TabsTrigger value="url" className="gap-2">
                      <LinkIcon className="h-4 w-4" />
                      URL externa
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="gif_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GIF del ejercicio</FormLabel>
                          {organizationId ? (
                            <ImageUpload
                              value={field.value}
                              onChange={field.onChange}
                              organizationId={organizationId}
                              bucket="exercises"
                              folder="gifs"
                              accept="images"
                              aspectRatio="video"
                              placeholder="Arrastra un GIF o imagen"
                            />
                          ) : (
                            <div className="border rounded-lg p-8 flex flex-col items-center justify-center bg-muted/30 text-muted-foreground">
                              <Loader2 className="h-8 w-8 animate-spin mb-2" />
                              <p className="text-sm">Cargando...</p>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="url" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="gif_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL del GIF</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://gymvisual.com/..."
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            GIFs disponibles en gymvisual.com
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchedGifUrl && (
                      <div className="border rounded-lg p-4 flex justify-center bg-muted/50">
                        <img
                          src={watchedGifUrl}
                          alt="Preview"
                          className="max-h-48 object-contain rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}

                    {!watchedGifUrl && (
                      <div className="border rounded-lg p-8 flex flex-col items-center justify-center bg-muted/30 text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mb-2" />
                        <p className="text-sm">Vista previa del GIF</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <FormField
                  control={form.control}
                  name="video_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL del video (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://youtube.com/..."
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Video de YouTube o enlace directo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-t pt-4 mt-4">
                  <FormField
                    control={form.control}
                    name="thumbnail_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thumbnail / Vista previa</FormLabel>
                        <FormDescription className="text-xs mb-2">
                          Imagen que se mostrara en la lista de ejercicios
                        </FormDescription>
                        {organizationId ? (
                          <ImageUpload
                            value={field.value}
                            onChange={field.onChange}
                            organizationId={organizationId}
                            bucket="exercises"
                            folder="thumbnails"
                            accept="images"
                            aspectRatio="square"
                            placeholder="Arrastra una imagen para el thumbnail"
                          />
                        ) : (
                          <div className="border rounded-lg p-8 flex flex-col items-center justify-center bg-muted/30 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                            <p className="text-sm">Cargando...</p>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Grupos musculares</CardTitle>
                <CardDescription>
                  Selecciona los musculos trabajados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {muscleGroups.map((muscle) => (
                    <Badge
                      key={muscle.value}
                      variant={watchedMuscleGroups.includes(muscle.value) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleMultiSelect('muscle_groups', muscle.value)}
                    >
                      {muscle.label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Equipo necesario</CardTitle>
                <CardDescription>
                  Selecciona el equipo requerido
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {equipmentOptions.map((equip) => (
                    <Badge
                      key={equip.value}
                      variant={watchedEquipment.includes(equip.value) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleMultiSelect('equipment', equip.value)}
                    >
                      {equip.label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Instrucciones</CardTitle>
              <CardDescription>
                Pasos para ejecutar el ejercicio correctamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Agregar instruccion..."
                  value={newInstruction}
                  onChange={(e) => setNewInstruction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addArrayItem('instructions', newInstruction, setNewInstruction)
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => addArrayItem('instructions', newInstruction, setNewInstruction)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {watchedInstructions.length > 0 && (
                <ol className="list-decimal list-inside space-y-2">
                  {watchedInstructions.map((instruction, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <span className="flex-1">{instruction}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeArrayItem('instructions', index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
                <CardDescription>
                  Consejos para mejorar la ejecucion
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Agregar tip..."
                    value={newTip}
                    onChange={(e) => setNewTip(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addArrayItem('tips', newTip, setNewTip)
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => addArrayItem('tips', newTip, setNewTip)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {watchedTips.length > 0 && (
                  <ul className="space-y-2">
                    {watchedTips.map((tip, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <span className="flex-1">• {tip}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeArrayItem('tips', index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Errores comunes</CardTitle>
                <CardDescription>
                  Errores frecuentes a evitar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Agregar error comun..."
                    value={newMistake}
                    onChange={(e) => setNewMistake(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addArrayItem('common_mistakes', newMistake, setNewMistake)
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => addArrayItem('common_mistakes', newMistake, setNewMistake)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {watchedMistakes.length > 0 && (
                  <ul className="space-y-2">
                    {watchedMistakes.map((mistake, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <span className="flex-1">• {mistake}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeArrayItem('common_mistakes', index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/exercises')}
              disabled={form.formState.isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create' ? 'Creando...' : 'Guardando...'}
                </>
              ) : mode === 'create' ? (
                'Crear ejercicio'
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
