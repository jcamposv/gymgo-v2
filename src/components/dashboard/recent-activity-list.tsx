'use client'

import { MoreHorizontal, Dumbbell, Wrench, AlertTriangle, CalendarCheck } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { RecentActivity } from '@/types/dashboard.types'

const iconMap = {
  session: { icon: Dumbbell, bgColor: 'bg-lime-100', textColor: 'text-lime-600' },
  maintenance: { icon: Wrench, bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
  alert: { icon: AlertTriangle, bgColor: 'bg-red-100', textColor: 'text-red-600' },
  booking: { icon: CalendarCheck, bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
}

interface RecentActivityListProps {
  activities: RecentActivity[]
  className?: string
}

export function RecentActivityList({ activities, className }: RecentActivityListProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map((activity) => {
          const config = iconMap[activity.type]
          const Icon = config.icon
          return (
            <div key={activity.id} className="flex gap-3">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                  config.bgColor
                )}
              >
                <Icon className={cn('h-4 w-4', config.textColor)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed">{activity.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
