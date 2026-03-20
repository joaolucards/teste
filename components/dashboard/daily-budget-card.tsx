'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { CalendarDays, TrendingDown } from 'lucide-react'

interface DailyBudgetCardProps {
  avgDaily: number
  avgMonthly: number
}

export function DailyBudgetCard({ avgDaily, avgMonthly }: DailyBudgetCardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gasto Diário Médio</CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(avgDaily)}
          </div>
          <p className="text-xs text-muted-foreground">
            Média dos últimos 30 dias
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projeção Mensal</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(avgMonthly)}
          </div>
          <p className="text-xs text-muted-foreground">
            Estimativa para o mês corrente
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
