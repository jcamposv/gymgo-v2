'use client'

import { FileText, ChevronRight, MoreHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { reportsLabels } from '@/lib/i18n'
import type { MemberReport } from '@/types/member.types'

interface FitnessReportsCardProps {
  reports: MemberReport[]
  className?: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function FitnessReportsCard({ reports, className }: FitnessReportsCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base font-semibold">{reportsLabels.title}</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{reportsLabels.noReports}</p>
        ) : (
          reports.map((report) => (
            <button
              key={report.id}
              className="flex w-full items-center justify-between gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <FileText className="h-5 w-5 text-red-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{report.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(report.file_size_bytes)}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))
        )}
      </CardContent>
    </Card>
  )
}
