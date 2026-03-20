'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Transaction, Category } from '@/lib/types'
import { ArrowDownLeft, ArrowUpRight, CreditCard, Banknote } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface RecentTransactionsProps {
  transactions: Transaction[]
  categories: Category[]
}

export function RecentTransactions({ transactions, categories }: RecentTransactionsProps) {
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  const getCategory = (id: string) => categories.find(c => c.id === id)

  if (recentTransactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>Últimas movimentações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-muted-foreground">
            <p>Nenhuma transação registrada</p>
            <Link href="/transactions">
              <Button variant="outline" size="sm">Adicionar transação</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>Últimas movimentações</CardDescription>
        </div>
        <Link href="/transactions">
          <Button variant="ghost" size="sm">Ver todas</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTransactions.map((tx) => {
            const category = getCategory(tx.categoryId)
            const isIncome = tx.type === 'income'
            
            return (
              <div key={tx.id} className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    isIncome 
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  )}
                >
                  {isIncome ? (
                    <ArrowDownLeft className="h-4 w-4" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{category?.name}</span>
                    {tx.paymentMethod && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {tx.paymentMethod === 'credit' ? (
                            <CreditCard className="h-3 w-3" />
                          ) : (
                            <Banknote className="h-3 w-3" />
                          )}
                          {tx.paymentMethod === 'credit' ? 'Crédito' : 'Débito'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-medium",
                    isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(tx.date)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
