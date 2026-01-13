'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ChevronDown,
  RotateCcw,
  GitCompare,
} from 'lucide-react'
import type { DateRange as DayPickerDateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import {
  useFinanceDateRange,
  DATE_PRESETS,
  type DateViewMode,
  type DatePreset,
} from '@/hooks/use-finance-date-range'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

// =============================================================================
// VIEW MODE CONFIG
// =============================================================================

interface ViewModeConfig {
  value: DateViewMode
  label: string
  shortLabel: string
}

const VIEW_MODES: ViewModeConfig[] = [
  { value: 'day', label: 'Dia', shortLabel: 'D' },
  { value: 'week', label: 'Semana', shortLabel: 'S' },
  { value: 'month', label: 'Mes', shortLabel: 'M' },
  { value: 'year', label: 'Año', shortLabel: 'A' },
]

// =============================================================================
// COMPONENT
// =============================================================================

interface FinanceDateToolbarProps {
  className?: string
  loading?: boolean
  showCompare?: boolean
}

export function FinanceDateToolbar({
  className,
  loading = false,
  showCompare = true,
}: FinanceDateToolbarProps) {
  const {
    view,
    from,
    to,
    compare,
    periodLabel,
    canGoNext,
    setView,
    setRange,
    goPrev,
    goNext,
    goToday,
    toggleCompare,
    applyPreset,
  } = useFinanceDateRange()

  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectedRange, setSelectedRange] = useState<DayPickerDateRange | undefined>({
    from,
    to,
  })

  const handleRangeSelect = (range: DayPickerDateRange | undefined) => {
    setSelectedRange(range)
    if (range?.from && range?.to) {
      setRange(range.from, range.to)
      setCalendarOpen(false)
    }
  }

  const handlePresetClick = (preset: DatePreset) => {
    applyPreset(preset)
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      {/* Left side: View mode tabs + Navigation */}
      <div className="flex items-center gap-2">
        {/* View mode selector */}
        <Tabs
          value={view === 'range' ? 'month' : view}
          onValueChange={(v) => setView(v as DateViewMode)}
          className="hidden sm:block"
        >
          <TabsList className="h-9">
            {VIEW_MODES.map((mode) => (
              <TabsTrigger
                key={mode.value}
                value={mode.value}
                className="px-3 text-xs"
                disabled={loading}
              >
                {mode.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Mobile view mode dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="sm:hidden">
            <Button variant="outline" size="sm" disabled={loading}>
              {VIEW_MODES.find((m) => m.value === (view === 'range' ? 'month' : view))?.label}
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {VIEW_MODES.map((mode) => (
              <DropdownMenuItem
                key={mode.value}
                onClick={() => setView(mode.value)}
              >
                {mode.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Navigation */}
        <div className="flex items-center rounded-md border">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-r-none"
            onClick={goPrev}
            disabled={loading}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Periodo anterior</span>
          </Button>

          {/* Period label / Today button */}
          <Button
            variant="ghost"
            className="h-9 min-w-[140px] rounded-none border-x px-3 font-medium"
            onClick={goToday}
            disabled={loading}
          >
            <span className="hidden sm:inline">{periodLabel}</span>
            <span className="sm:hidden">
              {view === 'day' && format(from, 'd MMM', { locale: es })}
              {view === 'week' && `Sem. ${format(from, 'w')}`}
              {view === 'month' && format(from, 'MMM yy', { locale: es })}
              {view === 'year' && format(from, 'yyyy')}
              {view === 'range' && `${format(from, 'd/M')} - ${format(to, 'd/M')}`}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-l-none"
            onClick={goNext}
            disabled={loading || !canGoNext}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Periodo siguiente</span>
          </Button>
        </div>

        {/* Today button (separate for clarity) */}
        <Button
          variant="outline"
          size="sm"
          className="hidden lg:flex"
          onClick={goToday}
          disabled={loading}
        >
          <RotateCcw className="mr-1 h-3 w-3" />
          Hoy
        </Button>
      </div>

      {/* Right side: Presets + Custom range + Compare */}
      <div className="flex items-center gap-2">
        {/* Presets dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={loading}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Presets</span>
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {DATE_PRESETS.slice(0, 4).map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                onClick={() => handlePresetClick(preset.id)}
              >
                {preset.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {DATE_PRESETS.slice(4, 7).map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                onClick={() => handlePresetClick(preset.id)}
              >
                {preset.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {DATE_PRESETS.slice(7).map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                onClick={() => handlePresetClick(preset.id)}
              >
                {preset.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Custom date range picker */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                view === 'range' && 'border-primary'
              )}
              disabled={loading}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Personalizado</span>
              <span className="sm:hidden">Rango</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              defaultMonth={from}
              selected={selectedRange}
              onSelect={handleRangeSelect}
              numberOfMonths={2}
              disabled={{ after: new Date() }}
              className="rounded-md border-0"
            />
            <div className="border-t p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {selectedRange?.from && selectedRange?.to
                    ? `${format(selectedRange.from, 'd MMM', { locale: es })} - ${format(selectedRange.to, 'd MMM yyyy', { locale: es })}`
                    : 'Selecciona un rango'}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCalendarOpen(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Compare toggle */}
        {showCompare && (
          <Button
            variant={compare ? 'default' : 'outline'}
            size="sm"
            className="hidden sm:flex"
            onClick={toggleCompare}
            disabled={loading}
          >
            <GitCompare className="mr-1 h-4 w-4" />
            Comparar
          </Button>
        )}
      </div>
    </div>
  )
}
