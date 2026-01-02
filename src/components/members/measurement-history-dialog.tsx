'use client'

import { useState } from 'react'
import { Loader2, Plus, History } from 'lucide-react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { measurementHistoryLabels } from '@/lib/i18n'
import { MeasurementHistoryChart, type MetricType } from './measurement-history-chart'
import { MeasurementHistoryTable } from './measurement-history-table'
import type { MeasurementWithBMI } from '@/types/member.types'

// =============================================================================
// TYPES
// =============================================================================

interface MeasurementHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  measurements: MeasurementWithBMI[]
  memberName?: string
  isLoading?: boolean
  onAddMeasurement?: () => void
}

// =============================================================================
// COMPONENT
// =============================================================================

export function MeasurementHistoryDialog({
  open,
  onOpenChange,
  measurements,
  memberName,
  isLoading = false,
  onAddMeasurement,
}: MeasurementHistoryDialogProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('weight')
  const labels = measurementHistoryLabels

  const handleAddMeasurement = () => {
    onOpenChange(false)
    onAddMeasurement?.()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {labels.title}
          </SheetTitle>
          <SheetDescription>
            {memberName ? `${memberName} - ` : ''}{labels.description}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64 px-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : measurements.length === 0 ? (
          <div className="px-4">
            <EmptyState onAddMeasurement={handleAddMeasurement} />
          </div>
        ) : (
          <div className="flex flex-col gap-6 mt-2 px-4 pb-4 overflow-y-auto flex-1">
            {/* Metric Tabs with Chart */}
            <Tabs
              value={selectedMetric}
              onValueChange={(v) => setSelectedMetric(v as MetricType)}
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="weight">{labels.weight}</TabsTrigger>
                <TabsTrigger value="bodyFat">{labels.bodyFat}</TabsTrigger>
                <TabsTrigger value="muscleMass">{labels.muscleMass}</TabsTrigger>
                <TabsTrigger value="bmi">{labels.bmi}</TabsTrigger>
              </TabsList>

              <TabsContent value="weight" className="mt-4">
                <MeasurementHistoryChart measurements={measurements} metric="weight" />
              </TabsContent>
              <TabsContent value="bodyFat" className="mt-4">
                <MeasurementHistoryChart measurements={measurements} metric="bodyFat" />
              </TabsContent>
              <TabsContent value="muscleMass" className="mt-4">
                <MeasurementHistoryChart measurements={measurements} metric="muscleMass" />
              </TabsContent>
              <TabsContent value="bmi" className="mt-4">
                <MeasurementHistoryChart measurements={measurements} metric="bmi" />
              </TabsContent>
            </Tabs>

            {/* History Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">{labels.tableTitle}</h3>
              <div className="overflow-x-auto">
                <MeasurementHistoryTable measurements={measurements} />
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// =============================================================================
// EMPTY STATE
// =============================================================================

interface EmptyStateProps {
  onAddMeasurement: () => void
}

function EmptyState({ onAddMeasurement }: EmptyStateProps) {
  const labels = measurementHistoryLabels

  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="text-center">
        <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-sm text-muted-foreground">{labels.noMeasurements}</p>
      </div>
      <Button onClick={onAddMeasurement}>
        <Plus className="h-4 w-4 mr-2" />
        {labels.addFirstMeasurement}
      </Button>
    </div>
  )
}
