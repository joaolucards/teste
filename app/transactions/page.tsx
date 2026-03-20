'use client'

import { Suspense, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TransactionForm, type SaveScopeInfo } from '@/components/transactions/transaction-form'
import { CategoryIcon, CategoryBadge } from '@/components/shared/category-icon'
import { useTransactions, useCategories } from '@/lib/hooks/use-finance'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Pencil, Trash2, ArrowDownLeft, ArrowUpRight, CreditCard, Banknote, Repeat, Filter } from 'lucide-react'
import type { Transaction } from '@/lib/types'
import { cn } from '@/lib/utils'
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
import { Empty, EmptyDescription, EmptyTitle } from '@/components/ui/empty'

function TransactionsContent() {
  const searchParams = useSearchParams()
  const { transactions, add, update, remove, splitFromDate, addOverride } = useTransactions()
  const { categories } = useCategories()

  const [isFormOpen, setIsFormOpen] = useState(searchParams.get('new') === 'true')
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>()
  const [deleteTransaction, setDeleteTransaction] = useState<Transaction | undefined>()

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(tx => typeFilter === 'all' || tx.type === typeFilter)
      .filter(tx => categoryFilter === 'all' || tx.categoryId === categoryFilter)
      .filter(tx => methodFilter === 'all' || tx.paymentMethod === methodFilter)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, typeFilter, categoryFilter, methodFilter])

  const handleSave = (transaction: Transaction, scopeInfo?: SaveScopeInfo) => {
    if (editingTransaction) {
      if (scopeInfo?.type === 'from-date') {
        splitFromDate(transaction.id, scopeInfo.date, transaction)
      } else if (scopeInfo?.type === 'this-only') {
        addOverride(transaction.id, {
          date: scopeInfo.date,
          amount: transaction.amount,
          title: transaction.title,
          categoryId: transaction.categoryId,
          effectiveDate: transaction.effectiveDate,
          paymentMethod: transaction.paymentMethod,
        })
      } else if (scopeInfo?.type === 'stop-from-date') {
        // Define a data final da recorrência como o dia anterior à data escolhida,
        // encerrando a série sem afetar as ocorrências já existentes
        const stopDate = new Date(scopeInfo.date)
        stopDate.setDate(stopDate.getDate() - 1)
        const endDate = stopDate.toISOString().split('T')[0]
        update(transaction.id, {
          recurrence: {
            ...editingTransaction.recurrence,
            endDate,
          },
        })
      } else {
        update(transaction.id, transaction)
      }
    } else {
      add(transaction)
    }
    setEditingTransaction(undefined)
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsFormOpen(true)
  }

  const handleDelete = () => {
    if (deleteTransaction) {
      remove(deleteTransaction.id)
      setDeleteTransaction(undefined)
    }
  }

  const handleNewTransaction = () => {
    setEditingTransaction(undefined)
    setIsFormOpen(true)
  }

  const getCategory = (id: string) => categories.find(c => c.id === id)

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {}
    for (const tx of filteredTransactions) {
      const dateKey = tx.date
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(tx)
    }
    return groups
  }, [filteredTransactions])

  return (
    <>
      <Header
        title="Transações"
        description="Gerencie suas receitas e despesas"
        actions={
          <Button onClick={handleNewTransaction}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Transação
          </Button>
        }
      />
      <main className="flex-1 p-4 md:p-6 space-y-4">
        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Filtros</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="income">Receitas</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="debit">Débito</SelectItem>
                  <SelectItem value="credit">Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="py-10">
              <Empty>
                <EmptyTitle>Nenhuma transação encontrada</EmptyTitle>
                <EmptyDescription>
                  {transactions.length === 0
                    ? 'Comece adicionando sua primeira transação'
                    : 'Tente ajustar os filtros para ver mais resultados'
                  }
                </EmptyDescription>
                <Button className="mt-4" onClick={handleNewTransaction}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Transação
                </Button>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedTransactions).map(([date, txs]) => (
              <Card key={date}>
                <CardHeader className="pb-2">
                  <CardDescription>{formatDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {txs.map((tx) => {
                    const category = getCategory(tx.categoryId)
                    const isIncome = tx.type === 'income'
                    const hasRecurrence = tx.recurrence.type !== 'none'

                    return (
                      <div
                        key={tx.id}
                        className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                      >
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
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
                            <p className="font-medium truncate">{tx.title || 'Sem título'}</p>
                            {hasRecurrence && (
                              <Repeat className="h-3 w-3 text-muted-foreground shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {category && (
                              <CategoryBadge
                                icon={category.icon}
                                color={category.color}
                                name={category.name}
                              />
                            )}
                            {tx.paymentMethod && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                {tx.paymentMethod === 'credit' ? (
                                  <CreditCard className="h-3 w-3" />
                                ) : (
                                  <Banknote className="h-3 w-3" />
                                )}
                                {tx.paymentMethod === 'credit' ? 'Crédito' : 'Débito'}
                              </span>
                            )}
                            {tx.paymentMethod === 'credit' && tx.effectiveDate !== tx.date && (
                              <span className="text-xs text-muted-foreground">
                                Débito em {formatDate(tx.effectiveDate)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className={cn(
                            "font-semibold",
                            isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          )}>
                            {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(tx)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTransaction(tx)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <TransactionForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
        transaction={editingTransaction}
        categories={categories}
      />

      <AlertDialog open={!!deleteTransaction} onOpenChange={() => setDeleteTransaction(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação de {deleteTransaction && formatCurrency(deleteTransaction.amount)}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function TransactionsPage() {
  return (
    <Suspense>
      <TransactionsContent />
    </Suspense>
  )
}
