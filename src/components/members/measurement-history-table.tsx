'use client'

import type { ColumnDef } from '@tanstack/react-table'

import { DataTable, DataTableColumnHeader } from '@/components/data-table'
import { measurementHistoryLabels, formatDate } from '@/lib/i18n'
import type { MeasurementWithBMI } from '@/types/member.types'

// =============================================================================
// HELPERS
// =============================================================================

function formatValue(value: number | null | undefined, suffix?: string): string {
  if (value === null || value === undefined) return '-'
  return suffix ? `${value} ${suffix}` : String(value)
}

// =============================================================================
// COLUMNS
// =============================================================================

const labels = measurementHistoryLabels

const measurementColumns: ColumnDef<MeasurementWithBMI>[] = [
  {
    accessorKey: 'measured_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={labels.dateColumn} />
    ),
    cell: ({ row }) => {
      const date = row.getValue('measured_at') as string
      return <span className="font-medium">{formatDate(date)}</span>
    },
  },
  {
    accessorKey: 'body_height_cm',
    header: () => (
      <span className="text-right block">{labels.heightColumn}</span>
    ),
    cell: ({ row }) => {
      const value = row.getValue('body_height_cm') as number | null
      return <span className="text-right block">{formatValue(value)}</span>
    },
  },
  {
    accessorKey: 'body_weight_kg',
    header: () => (
      <span className="text-right block">{labels.weightColumn}</span>
    ),
    cell: ({ row }) => {
      const value = row.getValue('body_weight_kg') as number | null
      return <span className="text-right block">{formatValue(value)}</span>
    },
  },
  {
    accessorKey: 'body_fat_percentage',
    header: () => (
      <span className="text-right block">{labels.bodyFatColumn}</span>
    ),
    cell: ({ row }) => {
      const value = row.getValue('body_fat_percentage') as number | null
      return <span className="text-right block">{formatValue(value, '%')}</span>
    },
  },
  {
    accessorKey: 'muscle_mass_kg',
    header: () => (
      <span className="text-right block">{labels.muscleMassColumn}</span>
    ),
    cell: ({ row }) => {
      const value = row.getValue('muscle_mass_kg') as number | null
      return <span className="text-right block">{formatValue(value)}</span>
    },
  },
  {
    accessorKey: 'waist_cm',
    header: () => (
      <span className="text-right block">{labels.waistColumn}</span>
    ),
    cell: ({ row }) => {
      const value = row.getValue('waist_cm') as number | null
      return <span className="text-right block">{formatValue(value)}</span>
    },
  },
  {
    accessorKey: 'hip_cm',
    header: () => (
      <span className="text-right block">{labels.hipColumn}</span>
    ),
    cell: ({ row }) => {
      const value = row.getValue('hip_cm') as number | null
      return <span className="text-right block">{formatValue(value)}</span>
    },
  },
  {
    accessorKey: 'bmi',
    header: () => (
      <span className="text-right block">{labels.bmiColumn}</span>
    ),
    cell: ({ row }) => {
      const value = row.getValue('bmi') as number | null
      return <span className="text-right block">{formatValue(value)}</span>
    },
  },
]

// =============================================================================
// COMPONENT
// =============================================================================

interface MeasurementHistoryTableProps {
  measurements: MeasurementWithBMI[]
}

export function MeasurementHistoryTable({ measurements }: MeasurementHistoryTableProps) {
  return (
    <DataTable
      columns={measurementColumns}
      data={measurements}
      mode="client"
      defaultPageSize={5}
      pageSizeOptions={[5, 10, 20]}
      sortable={true}
      defaultSort={[{ id: 'measured_at', desc: true }]}
      enableMobileCards={false}
      emptyTitle={labels.noMeasurements}
      emptyDescription={labels.noMeasurementsDescription}
    />
  )
}
