'use client'

import {
  MoreHorizontal,
  Sparkles,
  Wrench,
  Package,
  Wind,
  Move,
  ChevronRight,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { MaintenanceReport } from '@/types/dashboard.types'

const iconMap = {
  cleaning: Sparkles,
  maintenance: Wrench,
  restock: Package,
  hvac: Wind,
  relocation: Move,
}

interface ReportListProps {
  reports: MaintenanceReport[]
  className?: string
}

export function ReportList({ reports, className }: ReportListProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Report</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {reports.map((report) => {
          const Icon = iconMap[report.icon]
          return (
            <button
              key={report.id}
              className="flex w-full items-center justify-between gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{report.title}</p>
                  <p className="text-xs text-muted-foreground">{report.timeAgo}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
