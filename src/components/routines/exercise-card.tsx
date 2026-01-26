'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play, Clock, Dumbbell, ImageIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ExerciseItemWithMedia } from '@/actions/routine.actions'

interface ExerciseCardProps {
  exercise: ExerciseItemWithMedia
  index: number
  variant?: 'default' | 'compact'
}

export function ExerciseCard({ exercise, index, variant = 'default' }: ExerciseCardProps) {
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false)

  const hasMedia = exercise.gif_url || exercise.video_url
  const thumbnailSrc = exercise.thumbnail_url || exercise.gif_url

  const isCompact = variant === 'compact'

  return (
    <>
      <div
        className={`flex items-start gap-4 ${isCompact ? 'p-3 bg-muted/30' : 'p-4 border'} rounded-lg`}
      >
        <div className={`flex items-center justify-center ${isCompact ? 'w-6 h-6 text-sm' : 'w-8 h-8'} rounded-full bg-primary/10 text-primary font-medium`}>
          {index + 1}
        </div>

        {/* Thumbnail or placeholder */}
        <div
          className={`relative flex-shrink-0 ${isCompact ? 'w-12 h-12' : 'w-16 h-16'} rounded-lg overflow-hidden bg-muted cursor-pointer group`}
          onClick={() => hasMedia && setIsMediaDialogOpen(true)}
        >
          {thumbnailSrc ? (
            <Image
              src={thumbnailSrc}
              alt={exercise.exercise_name}
              fill
              className="object-cover"
              sizes={isCompact ? '48px' : '64px'}
              unoptimized={thumbnailSrc.includes('.gif')}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Dumbbell className={`${isCompact ? 'h-5 w-5' : 'h-6 w-6'} text-muted-foreground`} />
            </div>
          )}

          {/* Play overlay if has video/gif */}
          {hasMedia && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Play className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium ${isCompact ? 'text-sm' : ''}`}>{exercise.exercise_name}</h4>
            {hasMedia && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setIsMediaDialogOpen(true)}
              >
                <Play className="h-3 w-3 mr-1" />
                Ver
              </Button>
            )}
          </div>

          <div className={`flex flex-wrap gap-2 ${isCompact ? 'mt-1' : 'mt-2'}`}>
            {exercise.sets && (
              <Badge variant="outline" className={isCompact ? 'text-xs' : ''}>
                {exercise.sets} series
              </Badge>
            )}
            {exercise.reps && (
              <Badge variant="outline" className={isCompact ? 'text-xs' : ''}>
                {exercise.reps} reps
              </Badge>
            )}
            {exercise.weight && (
              <Badge variant="outline" className={isCompact ? 'text-xs' : ''}>
                {exercise.weight}
              </Badge>
            )}
            {exercise.rest_seconds && (
              <Badge variant="secondary" className={isCompact ? 'text-xs' : ''}>
                <Clock className="h-3 w-3 mr-1" />
                {exercise.rest_seconds}s{!isCompact && ' descanso'}
              </Badge>
            )}
            {exercise.tempo && !isCompact && (
              <Badge variant="secondary">
                Tempo: {exercise.tempo}
              </Badge>
            )}
          </div>

          {exercise.notes && !isCompact && (
            <p className="text-sm text-muted-foreground mt-2">
              {exercise.notes}
            </p>
          )}
        </div>
      </div>

      {/* Media Dialog */}
      <Dialog open={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{exercise.exercise_name}</DialogTitle>
          </DialogHeader>

          <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
            {exercise.video_url ? (
              <video
                src={exercise.video_url}
                controls
                autoPlay
                loop
                className="w-full h-full object-contain"
              />
            ) : exercise.gif_url ? (
              <Image
                src={exercise.gif_url}
                alt={exercise.exercise_name}
                fill
                className="object-contain"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground ml-2">Sin media disponible</p>
              </div>
            )}
          </div>

          {/* Exercise details in dialog */}
          <div className="flex flex-wrap gap-2">
            {exercise.sets && (
              <Badge variant="outline">
                {exercise.sets} series
              </Badge>
            )}
            {exercise.reps && (
              <Badge variant="outline">
                {exercise.reps} reps
              </Badge>
            )}
            {exercise.weight && (
              <Badge variant="outline">
                {exercise.weight}
              </Badge>
            )}
            {exercise.rest_seconds && (
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                {exercise.rest_seconds}s descanso
              </Badge>
            )}
            {exercise.tempo && (
              <Badge variant="secondary">
                Tempo: {exercise.tempo}
              </Badge>
            )}
          </div>

          {exercise.notes && (
            <p className="text-sm text-muted-foreground">
              {exercise.notes}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
