'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { FinancialCalendar } from '@/components/calendar/financial-calendar'
import { DayDetails } from '@/components/calendar/day-details'
import { TransactionForm, type SaveScopeInfo } from '@/components/transactions/transaction-form'
import { DailyBudgetForm } from '@/components/transactions/daily-budget-form'
import { VaultTransactionForm } from '@/components/vaults/vault-transaction-form'
import { useTransactions, useCategories, useSettings, useBalance, useVaults, useDailyBudget, DAILY_BUDGET_ID } from '@/lib/hooks/use-finance'
import type { Transaction, DailyBudgetOverride, VaultTransaction } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

export default function CalendarPage() {
  const {
    transactions, isLoading: txLoading,
    add, update, splitFromDate, addOverride, removeRecurrence,
  } = useTransactions()
  const { categories, isLoading: catLoading } = useCategories()
  const { settings } = useSettings()
  const { vaults, vaultTransactions, getTotalVaulted, updateVaultTransaction } = useVaults()
  const { settings: dailyBudgetSettings, saveOverride: saveDailyBudgetOverride, saveDefault: saveDailyBudgetDefault } = useDailyBudget()
  const { getTransactionsForDate, getBalanceForDate } = useBalance(
    transactions,
    settings.initialBalance,
    dailyBudgetSettings,
    getTotalVaulted(),
    { vaults, vaultTransactions },
  )

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDailyBudgetFormOpen, setIsDailyBudgetFormOpen] = useState(false)
  const [isVaultTxFormOpen, setIsVaultTxFormOpen] = useState(false)
  const [editingVaultTx, setEditingVaultTx] = useState<VaultTransaction | undefined>()
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>()
  const [editingOccurrenceDate, setEditingOccurrenceDate] = useState<string | undefined>()

  const isLoading = txLoading || catLoading

  const handleEditVaultTransaction = (vaultId: string, vaultTxId: string) => {
    const tx = (vaultTransactions[vaultId] ?? []).find(t => t.id === vaultTxId)
    if (tx) {
      setEditingVaultTx(tx)
      setIsVaultTxFormOpen(true)
    }
  }

  const handleEditDailyBudget = () => {
    setIsDailyBudgetFormOpen(true)
  }

  const handleSaveDailyBudget = (override: DailyBudgetOverride) => {
    saveDailyBudgetOverride(override)
  }

  const handleSaveDailyBudgetDefault = (amount: number, from: string, notes?: string) => {
    saveDailyBudgetDefault(amount, from, notes)
  }

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
              onEditDailyBudget={handleEditDailyBudget}
              onEditVaultTransaction={handleEditVaultTransaction}
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
      />

      {selectedDate && (
        <DailyBudgetForm
          open={isDailyBudgetFormOpen}
          onOpenChange={setIsDailyBudgetFormOpen}
          date={selectedDate}
          existing={dailyBudgetSettings.overrides.find(
            o => o.date === selectedDate.toISOString().split('T')[0]
          )}
          existingDefault={
            dailyBudgetSettings.defaultAmount !== undefined
              ? {
                  amount: dailyBudgetSettings.defaultAmount,
                  notes: dailyBudgetSettings.defaultNotes,
                  from: dailyBudgetSettings.defaultFrom,
                }
              : undefined
          }
          onSave={handleSaveDailyBudget}
          onSaveDefault={handleSaveDailyBudgetDefault}
        />
      )}

      <VaultTransactionForm
        open={isVaultTxFormOpen}
        onOpenChange={(v) => { if (!v) setEditingVaultTx(undefined); setIsVaultTxFormOpen(v) }}
        vaults={vaults}
        editingTransaction={editingVaultTx}
        onSave={(tx) => {
          updateVaultTransaction(tx.vaultId, tx.id, tx)
          setEditingVaultTx(undefined)
        }}
      />
    </>
  )
}
