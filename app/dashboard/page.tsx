'use client'

import { Header } from '@/components/layout/header'
import { BalanceCard } from '@/components/dashboard/balance-card'
import { ForecastChart } from '@/components/dashboard/forecast-chart'
import { CategoryBreakdown } from '@/components/dashboard/category-breakdown'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { useTransactions, useCategories, useSettings, useBalance } from '@/lib/hooks/use-finance'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
  const { transactions, isLoading: txLoading } = useTransactions()
  const { categories, isLoading: catLoading } = useCategories()
  const { settings } = useSettings()
  const { currentBalance, getForecast, getMonthSummary, getCategoryBreakdown } = useBalance(
    transactions,
    settings.initialBalance
  )

  const isLoading = txLoading || catLoading

  if (isLoading) {
    return (
      <>
        <Header title="Dashboard" />
        <main className="flex-1 space-y-6 p-4 md:p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-[350px]" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
          </div>
        </main>
      </>
    )
  }

  const currentMonth = new Date()
  const monthSummary = getMonthSummary(currentMonth)
  const forecast = getForecast(30)
  const expenseBreakdown = getCategoryBreakdown(currentMonth, 'expense')

  return (
    <>
      <Header 
        title="Dashboard" 
        actions={
          <Link href="/transactions?new=true">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nova Transação
            </Button>
          </Link>
        }
      />
      <main className="flex-1 space-y-6 p-4 md:p-6">
        <BalanceCard
          currentBalance={currentBalance}
          monthIncome={monthSummary.income}
          monthExpenses={monthSummary.expenses}
        />

        <ForecastChart forecast={forecast} />

        <div className="grid gap-4 md:grid-cols-2">
          <CategoryBreakdown
            breakdown={expenseBreakdown}
            categories={categories}
            type="expense"
          />
          <RecentTransactions
            transactions={transactions}
            categories={categories}
          />
        </div>
      </main>
    </>
  )
}
