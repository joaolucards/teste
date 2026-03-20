'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Category, ExpandedTransaction } from '@/lib/types'
import {
  Plus, ArrowDownLeft, ArrowUpRight, CreditCard, Banknote,
  Repeat, Wallet, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type DeleteScope = 'all' | 'this-only' | 'from-date'

interface PendingDelete {
  transactionId: string
  occurrenceDate: string
  isRecurrence: boolean
}

interface DayDetailsProps {
  date: Date
  transactions: ExpandedTransaction[]
  categories: Category[]
  balance: number
  onAddTransaction: () => void
  onEditTransaction: (transactionId: string, occurrenceDate?: string) => void
  onDeleteTransaction: (
    transactionId: string,
    scope: DeleteScope,
    occurrenceDate: string,
  ) => void
}

export function DayDetails({
  date,
  transactions,
  categories,
  balance,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: DayDetailsProps) {
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [selectedScope, setSelectedScope] = useState<DeleteScope>('this-only')

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

  function handleDeleteClick(tx: ExpandedTransaction, e: React.MouseEvent) {
    e.stopPropagation()
    const isRec = tx.isRecurrence || false
    setPendingDelete({
      transactionId: tx.originalId || tx.id,
      occurrenceDate: tx.occurrenceDate || tx.date,
      isRecurrence: isRec,
    })
    setSelectedScope(isRec ? 'this-only' : 'all')
  }

  function handleConfirmDelete() {
    if (!pendingDelete) return
    onDeleteTransaction(pendingDelete.transactionId, selectedScope, pendingDelete.occurrenceDate)
    setPendingDelete(null)
  }

  const scopeOptions: { value: DeleteScope; label: string; description: string }[] = [
    {
      value: 'this-only',
      label: 'Somente esta ocorrência',
      description: 'Remove apenas este dia. As outras ocorrências continuam normalmente.',
    },
    {
      value: 'from-date',
      label: 'Esta e as futuras',
      description: 'Remove esta ocorrência e todas as seguintes. Ocorrências anteriores são mantidas.',
    },
    {
      value: 'all',
      label: 'Todas as ocorrências',
      description: 'Remove completamente esta transação recorrente do início ao fim.',
    },
  ]

  return (
    <>
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
                'text-xl font-bold',
                balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
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
                  <div
                    key={tx.id}
                    className="group flex w-full items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    {/* Clickable area for editing */}
                    <button
                      className="flex flex-1 items-center gap-3 text-left min-w-0"
                      onClick={() => onEditTransaction(
                        tx.originalId || tx.id,
                        tx.isRecurrence ? tx.occurrenceDate : undefined
                      )}
                      title={tx.isRecurrence ? 'Clique para editar esta ocorrência' : 'Clique para editar'}
                    >
                      <div className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        isIncome
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      )}>
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
                            <Repeat
                              className="h-3 w-3 text-muted-foreground shrink-0"
                              title="Ocorrência recorrente"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {category && (
                            <span className="text-xs text-muted-foreground">{category.name}</span>
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

                      <p className={cn(
                        'text-sm font-semibold shrink-0',
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      )}>
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDeleteClick(tx, e)}
                      className="shrink-0 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      title="Excluir transação"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => { if (!open) setPendingDelete(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transação</AlertDialogTitle>
            <AlertDialogDescription asChild>
              {pendingDelete?.isRecurrence ? (
                <div className="space-y-3 pt-1">
                  <p className="text-sm text-muted-foreground">
                    Esta é uma transação recorrente. Como você deseja excluí-la?
                  </p>
                  <div className="space-y-2">
                    {scopeOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                          selectedScope === opt.value
                            ? 'border-destructive bg-destructive/5'
                            : 'hover:bg-muted/50'
                        )}
                      >
                        <input
                          type="radio"
                          name="delete-scope"
                          value={opt.value}
                          checked={selectedScope === opt.value}
                          onChange={() => setSelectedScope(opt.value)}
                          className="mt-0.5 accent-destructive"
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">{opt.label}</p>
                          <p className="text-xs text-muted-foreground">{opt.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <span>
                  Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
