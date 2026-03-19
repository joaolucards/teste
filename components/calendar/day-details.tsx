'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CategoryIcon, CategoryBadge } from '@/components/shared/category-icon'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Category, ExpandedTransaction } from '@/lib/types'
import { Plus, ArrowDownLeft, ArrowUpRight, CreditCard, Banknote, Repeat, Wallet, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DayDetailsProps {
  date: Date
  transactions: ExpandedTransaction[]
  categories: Category[]
  balance: number
  onAddTransaction: () => void
  onEditTransaction: (transactionId: string, occurrenceDate?: string) => void
}

export function DayDetails({ 
  date, 
  transactions, 
  categories, 
  balance,
  onAddTransaction,
  onEditTransaction 
}: DayDetailsProps) {
  const getCategory = (id: string) => categories.find(c => c.id === id)
  
  const income = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0)
  
  const expenses = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isToday = date.toDateString() === today.toDateString()
  const isFuture = date > today

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}
            </CardTitle>
            <CardDescription>
              {isToday ? 'Hoje' : isFuture ? 'Previsão' : 'Histórico'}
            </CardDescription>
          </div>
          <Button size="sm" onClick={onAddTransaction}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Card */}
        <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {isFuture ? 'Saldo previsto' : 'Saldo'}
            </p>
            <p className={cn(
              "text-xl font-bold",
              balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            )}>
              {formatCurrency(balance)}
            </p>
          </div>
        </div>

        {/* Summary */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Receitas</p>
              <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                +{formatCurrency(income)}
              </p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
              <p className="text-xs text-red-600 dark:text-red-400">Despesas</p>
              <p className="text-lg font-semibold text-red-700 dark:text-red-300">
                -{formatCurrency(expenses)}
              </p>
            </div>
          </div>
        )}

        {/* Transactions List */}
        {transactions.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>Nenhuma transação neste dia</p>
            <Button variant="link" className="mt-2" onClick={onAddTransaction}>
              Adicionar transação
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Transações</h4>
            {transactions.map((tx) => {
              const category = getCategory(tx.categoryId)
              const isIncome = tx.type === 'income'
              
              return (
                <button
                  key={tx.id}
                  onClick={() => onEditTransaction(tx.originalId || tx.id, tx.isRecurrence ? tx.occurrenceDate : undefined)}
                  className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 cursor-pointer"
                  title={tx.isRecurrence ? "Clique para editar esta ocorrência" : "Clique para editar"}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
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
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {tx.description || 'Sem descrição'}
                      </p>
                      {tx.isRecurrence && (
                        <Repeat className="h-3 w-3 text-muted-foreground shrink-0" title="Ocorrência recorrente" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {category && (
                        <span className="text-xs text-muted-foreground">
                          {category.name}
                        </span>
                      )}
                      {tx.paymentMethod && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            {tx.paymentMethod === 'credit' ? (
                              <CreditCard className="h-3 w-3" />
                            ) : (
                              <Banknote className="h-3 w-3" />
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <p className={cn(
                      "text-sm font-semibold",
                      isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    {!tx.isRecurrence && (
                      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
