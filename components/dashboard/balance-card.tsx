'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BalanceCardProps {
  currentBalance: number
  monthIncome: number
  monthExpenses: number
}

export function BalanceCard({ currentBalance, monthIncome, monthExpenses }: BalanceCardProps) {
  const isPositive = currentBalance >= 0

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-2xl font-bold",
            isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )}>
            {formatCurrency(currentBalance)}
          </div>
          <p className="text-xs text-muted-foreground">
            {isPositive ? 'Saldo positivo' : 'Saldo negativo'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(monthIncome)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total de entradas este mês
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(monthExpenses)}
          </div>
          <p className="text-xs text-muted-foreground">
            Total de saídas este mês
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
