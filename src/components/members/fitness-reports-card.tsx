'use client'

import { ChevronRight, MoreHorizontal, FileText } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { reportsLabels } from '@/lib/i18n'
import type { MemberReport } from '@/types/member.types'

// =============================================================================
// HELPERS
// =============================================================================

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// =============================================================================
// PDF ICON COMPONENT
// =============================================================================

function PdfIcon({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <FileText className="h-5 w-5 text-green-700" />
      <span className="text-[8px] font-bold text-green-700 -mt-0.5">PDF</span>
    </div>
  )
}

// =============================================================================
// COMPONENT
// =============================================================================

interface FitnessReportsCardProps {
  reports: MemberReport[]
  className?: string
}

export function FitnessReportsCard({ reports, className }: FitnessReportsCardProps) {
  return (
    <Card className={cn('bg-muted/50 border-0 shadow-none', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base font-semibold">{reportsLabels.title}</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 pb-6">
        {reports.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">{reportsLabels.noReports}</p>
          </div>
        ) : (
          reports.map((report) => (
            <ReportItem key={report.id} report={report} />
          ))
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// REPORT ITEM
// =============================================================================

interface ReportItemProps {
  report: MemberReport
}

function ReportItem({ report }: ReportItemProps) {
  return (
    <button
      className="flex w-full items-center gap-3 rounded-xl bg-white p-3 hover:bg-gray-50 transition-colors text-left"
    >
      {/* PDF Icon */}
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-green-100">
        <PdfIcon />
      </div>

      {/* File Info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight break-words">
          {report.title}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {formatFileSize(report.file_size_bytes)}
        </p>
      </div>

      {/* Chevron Button */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
        <ChevronRight className="h-5 w-5 text-gray-600" />
      </div>
    </button>
  )
}
