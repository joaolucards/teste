'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { FinancialCalendar } from '@/components/calendar/financial-calendar'
import { DayDetails } from '@/components/calendar/day-details'
import { TransactionForm, type SaveScopeInfo } from '@/components/transactions/transaction-form'
import { useTransactions, useCategories, useSettings, useBalance } from '@/lib/hooks/use-finance'
import type { Transaction } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

export default function CalendarPage() {
  const {
    transactions, isLoading: txLoading,
    add, update, splitFromDate, addOverride, removeRecurrence,
  } = useTransactions()
  const { categories, isLoading: catLoading } = useCategories()
  const { settings } = useSettings()
  const { getTransactionsForDate, getBalanceForDate } = useBalance(
    transactions,
    settings.initialBalance
  )

  const hasDailyBudget = transactions.some(tx => tx.isDailyBudget)

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>()
  const [editingOccurrenceDate, setEditingOccurrenceDate] = useState<string | undefined>()

  const isLoading = txLoading || catLoading

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleAddTransaction = () => {
    setEditingTransaction(undefined)
    setEditingOccurrenceDate(undefined)
    setIsFormOpen(true)
  }

  const handleEditTransaction = (transactionId: string, occurrenceDate?: string) => {
    const tx = transactions.find(t => t.id === transactionId)
    if (tx) {
      setEditingTransaction(tx)
      setEditingOccurrenceDate(occurrenceDate)
      setIsFormOpen(true)
    }
  }

  const handleDeleteTransaction = (
    transactionId: string,
    scope: 'all' | 'this-only' | 'from-date',
    occurrenceDate: string,
  ) => {
    removeRecurrence(transactionId, scope, occurrenceDate)
  }

  const handleSaveTransaction = (transaction: Transaction, scopeInfo?: SaveScopeInfo) => {
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
      } else {
        update(transaction.id, transaction)
      }
    } else {
      add(transaction)
    }
    setEditingTransaction(undefined)
    setEditingOccurrenceDate(undefined)
  }

  if (isLoading) {
    return (
      <>
        <Header title="Calendário" description="Visualize suas transações no calendário" />
        <main className="flex-1 p-4 md:p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
            <Skeleton className="h-[500px]" />
            <Skeleton className="h-[500px]" />
          </div>
        </main>
      </>
    )
  }

  const selectedDateTransactions = selectedDate
    ? getTransactionsForDate(selectedDate)
    : []

  const selectedDateBalance = selectedDate
    ? getBalanceForDate(selectedDate)
    : 0

  return (
    <>
      <Header
        title="Calendário"
        description="Visualize suas transações no calendário"
      />
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          <Card>
            <CardContent className="p-4">
              <FinancialCalendar
                transactions={transactions}
                categories={categories}
                onDateSelect={handleDateSelect}
                selectedDate={selectedDate}
                getTransactionsForDate={getTransactionsForDate}
                getBalanceForDate={getBalanceForDate}
              />
            </CardContent>
          </Card>

          {selectedDate && (
            <DayDetails
              date={selectedDate}
              transactions={selectedDateTransactions}
              categories={categories}
              balance={selectedDateBalance}
              onAddTransaction={handleAddTransaction}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}
        </div>
      </main>

      <TransactionForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveTransaction}
        transaction={editingTransaction}
        categories={categories}
        defaultDate={selectedDate || undefined}
        occurrenceDate={editingOccurrenceDate}
        hasDailyBudget={hasDailyBudget && !editingTransaction?.isDailyBudget}
      />
    </>
  )
}
