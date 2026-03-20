'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toISODateString, formatCurrency } from '@/lib/utils'
import type { Transaction, Category, ExpandedTransaction } from '@/lib/types'

interface FinancialCalendarProps {
  transactions: Transaction[]
  categories: Category[]
  onDateSelect: (date: Date) => void
  selectedDate: Date | null
  getTransactionsForDate: (date: Date) => ExpandedTransaction[]
  getBalanceForDate: (date: Date) => number
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export function FinancialCalendar({
  transactions,
  categories,
  onDateSelect,
  selectedDate,
  getTransactionsForDate,
  getBalanceForDate,
}: FinancialCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Build calendar grid — always fill to complete rows (multiple of 7)
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const startOffset = firstDay.getDay()
    const totalDays = lastDay.getDate()

    const days: (Date | null)[] = []

    for (let i = 0; i < startOffset; i++) days.push(null)
    for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i))

    // Pad end so total length is a multiple of 7 (complete last row)
    while (days.length % 7 !== 0) days.push(null)

    return days
  }, [currentMonth])

  const dayInfo = useMemo(() => {
    const info: Record<string, { hasIncome: boolean; hasExpense: boolean; total: number }> = {}

    for (const day of calendarDays) {
      if (!day) continue
      const dateStr = toISODateString(day)
      const dayTxs = getTransactionsForDate(day)
      let income = 0
      let expense = 0
      for (const tx of dayTxs) {
        if (tx.type === 'income') income += tx.amount
        else expense += tx.amount
      }
      info[dateStr] = { hasIncome: income > 0, hasExpense: expense > 0, total: income - expense }
    }

    return info
  }, [calendarDays, getTransactionsForDate])

  const goToPreviousMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))

  const goToNextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

  const goToToday = () => {
    const now = new Date()
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    onDateSelect(now)
  }

  const currentYear = today.getFullYear()
  const START_YEAR = currentYear - 5
  const END_YEAR = 2050
  const YEARS = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i)

  const handleMonthChange = (value: string) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), parseInt(value), 1))
  }

  const handleYearChange = (value: string) => {
    setCurrentMonth(new Date(parseInt(value), currentMonth.getMonth(), 1))
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        {/* Month + Year selects */}
        <div className="flex items-center gap-2">
          <Select value={String(currentMonth.getMonth())} onValueChange={handleMonthChange}>
            <SelectTrigger className="h-9 w-[145px] text-lg font-semibold border-none shadow-none px-2 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((name, idx) => (
                <SelectItem key={idx} value={String(idx)}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={YEARS.includes(currentMonth.getFullYear()) ? String(currentMonth.getFullYear()) : undefined} onValueChange={handleYearChange}>
            <SelectTrigger className="h-9 w-[90px] text-lg font-semibold border-none shadow-none px-2 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((year) => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid
          border on the container provides the right + bottom edges;
          each cell only draws top + left so no double-lines */}
      <div className="rounded-lg border overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-muted/50">
          {WEEKDAYS.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Days — wrapped in a bordered container so trailing empty cells get edges too */}
        <div className="grid grid-cols-7 border-b border-r">
          {calendarDays.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  className="aspect-square border-t border-l bg-muted/20"
                />
              )
            }

            const dateStr = toISODateString(day)
            const info = dayInfo[dateStr]
            const isToday = dateStr === toISODateString(today)
            const isSelected = selectedDate && dateStr === toISODateString(selectedDate)
            const isPast = day < today

            return (
              <button
                key={dateStr}
                onClick={() => onDateSelect(day)}
                className={cn(
                  'aspect-square border-t border-l p-1 transition-colors hover:bg-muted/50 flex flex-col',
                  isSelected && 'bg-primary/10 ring-2 ring-primary ring-inset',
                  isToday && !isSelected && 'bg-accent',
                )}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-sm',
                      isToday && 'bg-primary text-primary-foreground font-semibold',
                      isPast && !isToday && 'text-muted-foreground',
                    )}
                  >
                    {day.getDate()}
                  </span>

                  {/* Indicators */}
                  <div className="flex gap-0.5">
                    {info?.hasIncome && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                    {info?.hasExpense && <div className="h-2 w-2 rounded-full bg-red-500" />}
                  </div>
                </div>

                {(isSelected || info?.hasIncome || info?.hasExpense) && (
                  <div className="mt-auto">
                    {info && (info.hasIncome || info.hasExpense) && (
                      <span
                        className={cn(
                          'text-[10px] font-medium',
                          info.total >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400',
                        )}
                      >
                        {info.total >= 0 ? '+' : ''}
                        {formatCurrency(info.total)}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span>Receita</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span>Despesa</span>
        </div>
      </div>
    </div>
  )
}
