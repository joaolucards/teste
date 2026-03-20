'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Transaction, Category, AccountSettings, ExpandedTransaction, RecurrenceOverride, DailyBudgetSettings, DailyBudgetOverride } from '../types'
import * as fs from '../firestore'
import { useAuth } from '@/components/auth/auth-provider'
import { toISODateString, addDays, addMonths, parseISODate } from '../utils'
import { DEFAULT_SETTINGS } from '../constants'
import { toast } from 'sonner'

// ─── Transactions ─────────────────────────────────────────────────

export function useTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) { setTransactions([]); setIsLoading(false); return }
    setIsLoading(true)
    const unsub = fs.subscribeTransactions(user.uid, (txs) => {
      setTransactions(txs)
      setIsLoading(false)
    })
    return unsub
  }, [user])

  const add = useCallback(async (tx: Transaction) => {
    if (!user) return
    try {
      await fs.addTransaction(user.uid, tx)
    } catch (err) {
      console.error('Erro ao adicionar transação:', err)
      toast.error('Erro ao salvar transação. Tente novamente.')
    }
  }, [user])

  const update = useCallback(async (id: string, updates: Partial<Transaction>) => {
    if (!user) return
    try {
      await fs.updateTransaction(user.uid, id, updates)
    } catch (err) {
      console.error('Erro ao atualizar transação:', err)
      toast.error('Erro ao atualizar transação. Tente novamente.')
    }
  }, [user])

  const remove = useCallback(async (id: string) => {
    if (!user) return
    try {
      await fs.deleteTransaction(user.uid, id)
    } catch (err) {
      console.error('Erro ao remover transação:', err)
      toast.error('Erro ao remover transação. Tente novamente.')
    }
  }, [user])

  const splitFromDate = useCallback(async (
    id: string, fromDate: string, updates: Partial<Transaction>
  ) => {
    if (!user) return
    try {
      await fs.splitTransactionFromDate(user.uid, id, fromDate, updates)
    } catch (err) {
      console.error('Erro ao dividir transação:', err)
      toast.error('Erro ao salvar. Tente novamente.')
    }
  }, [user])

  const addOverride = useCallback(async (id: string, override: RecurrenceOverride) => {
    if (!user) return
    try {
      await fs.addRecurrenceOverride(user.uid, id, override)
    } catch (err) {
      console.error('Erro ao salvar override:', err)
      toast.error('Erro ao salvar. Tente novamente.')
    }
  }, [user])

  const removeRecurrence = useCallback(async (
    id: string,
    scope: 'all' | 'this-only' | 'from-date',
    occurrenceDate: string,
  ) => {
    if (!user) return
    try {
      await fs.deleteRecurrenceScope(user.uid, id, scope, occurrenceDate)
    } catch (err) {
      console.error('Erro ao remover recorrência:', err)
      toast.error('Erro ao remover. Tente novamente.')
    }
  }, [user])

  return { transactions, isLoading, add, update, remove, splitFromDate, addOverride, removeRecurrence }
}



// ─── Daily Budget ─────────────────────────────────────────────────────────────

export const DAILY_BUDGET_ID = '__daily_budget__'

export function useDailyBudget() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<DailyBudgetSettings>({ overrides: [] })

  useEffect(() => {
    if (!user) { setSettings({ overrides: [] }); return }
    const unsub = fs.subscribeDailyBudget(user.uid, setSettings)
    return unsub
  }, [user])

  const saveOverride = useCallback(async (override: DailyBudgetOverride) => {
    if (!user) return
    try {
      await fs.saveDailyBudgetOverride(user.uid, override)
    } catch (err) {
      console.error('Erro ao salvar gasto diário:', err)
      toast.error('Erro ao salvar. Tente novamente.')
    }
  }, [user])

  return { settings, saveOverride }
}

// ─── Categories ───────────────────────────────────────────────────

export function useCategories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) { setCategories([]); setIsLoading(false); return }
    setIsLoading(true)
    const unsub = fs.subscribeCategories(user.uid, (cats) => {
      setCategories(cats)
      setIsLoading(false)
    })
    return unsub
  }, [user])

  const add = useCallback(async (cat: Category) => {
    if (!user) return
    await fs.addCategory(user.uid, cat)
  }, [user])

  const update = useCallback(async (id: string, updates: Partial<Category>) => {
    if (!user) return
    await fs.updateCategory(user.uid, id, updates)
  }, [user])

  const remove = useCallback(async (id: string) => {
    if (!user) return
    await fs.deleteCategory(user.uid, id)
  }, [user])

  const getById = useCallback((id: string) =>
    categories.find(c => c.id === id), [categories])

  const incomeCategories  = useMemo(() => categories.filter(c => c.type === 'income'),  [categories])
  const expenseCategories = useMemo(() => categories.filter(c => c.type === 'expense'), [categories])

  return { categories, incomeCategories, expenseCategories, isLoading, add, update, remove, getById }
}

// ─── Settings ─────────────────────────────────────────────────────

export function useSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<AccountSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    if (!user) { setSettings(DEFAULT_SETTINGS); return }
    const unsub = fs.subscribeSettings(user.uid, setSettings)
    return unsub
  }, [user])

  const update = useCallback(async (updates: Partial<AccountSettings>) => {
    if (!user) return
    const newSettings = { ...settings, ...updates }
    await fs.saveSettings(user.uid, newSettings)
    setSettings(newSettings)
  }, [user, settings])

  return { settings, update }
}

// ─── Recorrência ──────────────────────────────────────────────────

function getNthOccurrence(baseDate: Date, tx: Transaction, n: number): Date {
  switch (tx.recurrence.type) {
    case 'daily':   return addDays(baseDate, n)
    case 'weekly':  return addDays(baseDate, n * 7)
    case 'monthly': return addMonths(baseDate, n)
    case 'custom':  return addDays(baseDate, n * (tx.recurrence.interval ?? 30))
    default:        return baseDate
  }
}

function expandRecurrences(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): ExpandedTransaction[] {
  const expanded: ExpandedTransaction[] = []

  for (const tx of transactions) {
    const baseDate = parseISODate(tx.effectiveDate)

    if (tx.recurrence.type === 'none') {
      if (baseDate >= startDate && baseDate <= endDate) {
        expanded.push({ ...tx, occurrenceDate: tx.effectiveDate, isRecurrence: false })
      }
      continue
    }

    const recurrenceEnd = tx.recurrence.endDate
      ? parseISODate(tx.recurrence.endDate)
      : endDate

    let n = 0
    while (true) {
      const occurrence = getNthOccurrence(baseDate, tx, n)
      if (occurrence > endDate || occurrence > recurrenceEnd) break

      const dateStr  = toISODateString(occurrence)
      const isFirst  = n === 0
      const override = tx.overrides?.find(o => o.date === dateStr)

      if (!override?.skip && occurrence >= startDate) {
        expanded.push({
          ...tx,
          amount:        override?.amount        ?? tx.amount,
          title:         override?.title         ?? tx.title,
          categoryId:    override?.categoryId    ?? tx.categoryId,
          effectiveDate: override?.effectiveDate ?? dateStr,
          paymentMethod: override?.paymentMethod ?? tx.paymentMethod,
          id:            isFirst ? tx.id : `${tx.id}-${dateStr}`,
          date:          dateStr,
          occurrenceDate: dateStr,
          isRecurrence:  !isFirst,
          originalId:    isFirst ? undefined : tx.id,
        })
      }
      n++
    }
  }

  return expanded.sort((a, b) =>
    new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime()
  )
}

// ─── Balance ──────────────────────────────────────────────────────

export function useBalance(
  transactions: Transaction[],
  initialBalance: number,
  dailyBudgetSettings?: DailyBudgetSettings,
) {
  const currentBalance = useMemo(() => {
    const today = toISODateString(new Date())
    const txBalance = transactions.reduce((bal, tx) => {
      if (tx.effectiveDate <= today) {
        return tx.type === 'income' ? bal + tx.amount : bal - tx.amount
      }
      return bal
    }, initialBalance)
    // Subtract daily budget overrides up to today
    const dailyTotal = (dailyBudgetSettings?.overrides ?? [])
      .filter(o => o.date <= today)
      .reduce((s, o) => s + o.amount, 0)
    return txBalance - dailyTotal
  }, [transactions, initialBalance, dailyBudgetSettings])

  const getForecast = useCallback((days = 30) => {
    const today   = new Date()
    const endDate = addDays(today, days)
    const expanded = expandRecurrences(transactions, today, endDate)
    const forecast: { date: string; balance: number; transactions: ExpandedTransaction[] }[] = []
    let running = currentBalance

    for (let i = 0; i <= days; i++) {
      const date    = toISODateString(addDays(today, i))
      const dayTxs  = expanded.filter(t => t.effectiveDate === date)
      for (const t of dayTxs) {
        running = t.type === 'income' ? running + t.amount : running - t.amount
      }
      // Include daily budget override if exists for this date
      const dbOverride = dailyBudgetSettings?.overrides.find(o => o.date === date)
      if (dbOverride && dbOverride.amount > 0) {
        running -= dbOverride.amount
      }
      forecast.push({ date, balance: running, transactions: dayTxs })
    }
    return forecast
  }, [transactions, currentBalance, dailyBudgetSettings])

  const getTransactionsForDate = useCallback((date: Date) => {
    const s = new Date(date); s.setHours(0, 0, 0, 0)
    const e = new Date(date); e.setHours(23, 59, 59, 999)
    const regular = expandRecurrences(transactions, s, e)

    // Inject synthetic daily budget entry
    const dateStr = toISODateString(new Date(date))
    const override = dailyBudgetSettings?.overrides.find(o => o.date === dateStr)
    const dailyEntry: ExpandedTransaction = {
      id: `${DAILY_BUDGET_ID}-${dateStr}`,
      originalId: DAILY_BUDGET_ID,
      type: 'expense',
      amount: override?.amount ?? 0,
      categoryId: '',
      title: 'Gasto Diário',
      notes: override?.notes,
      date: dateStr,
      effectiveDate: dateStr,
      occurrenceDate: dateStr,
      isRecurrence: true,
      isDailyBudget: true,
      createdAt: '',
    }

    return [...regular, dailyEntry]
  }, [transactions, dailyBudgetSettings])

  const getBalanceForDate = useCallback((targetDate: Date) => {
    const today  = new Date(); today.setHours(0, 0, 0, 0)
    const target = new Date(targetDate); target.setHours(0, 0, 0, 0)

    if (target <= today) {
      const str = toISODateString(target)
      const txBal = transactions.reduce((bal, tx) => {
        if (tx.effectiveDate <= str) {
          return tx.type === 'income' ? bal + tx.amount : bal - tx.amount
        }
        return bal
      }, initialBalance)
      const dailyTotal = (dailyBudgetSettings?.overrides ?? [])
        .filter(o => o.date <= str)
        .reduce((s, o) => s + o.amount, 0)
      return txBal - dailyTotal
    }

    const days     = Math.ceil((target.getTime() - today.getTime()) / 86_400_000)
    const forecast = getForecast(days)
    return forecast.find(f => f.date === toISODateString(target))?.balance ?? currentBalance
  }, [transactions, initialBalance, currentBalance, getForecast])

  const getMonthSummary = useCallback((month: Date) => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1)
    const end   = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    const expanded = expandRecurrences(transactions, start, end)
    const income   = expanded.filter(t => t.type === 'income') .reduce((s, t) => s + t.amount, 0)
    const expenses = expanded.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { income, expenses, balance: income - expenses }
  }, [transactions])

  const getCategoryBreakdown = useCallback((month: Date, type: 'income' | 'expense' = 'expense') => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1)
    const end   = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    const expanded = expandRecurrences(transactions, start, end).filter(t => t.type === type)
    const breakdown: Record<string, number> = {}
    for (const t of expanded) {
      breakdown[t.categoryId] = (breakdown[t.categoryId] || 0) + t.amount
    }
    return breakdown
  }, [transactions])


  /**
   * Retorna estatísticas da transação de Gasto Diário.
   * avgDaily  — média dos últimos 30 dias com valor > 0
   * avgMonthly — avgDaily × dias do mês corrente
   */
  const getDailyBudgetStats = useCallback(() => {
    const overrides = dailyBudgetSettings?.overrides ?? []
    const today = new Date()
    const thirtyDaysAgo = toISODateString(addDays(today, -30))
    const todayStr = toISODateString(today)

    const recent = overrides.filter(o => o.date >= thirtyDaysAgo && o.date <= todayStr && o.amount > 0)
    if (recent.length === 0) return { avgDaily: 0, avgMonthly: 0 }

    const total = recent.reduce((s, o) => s + o.amount, 0)
    const avgDaily = total / recent.length
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    return { avgDaily, avgMonthly: avgDaily * daysInMonth }
  }, [dailyBudgetSettings])

  return { currentBalance, getForecast, getTransactionsForDate, getBalanceForDate, getMonthSummary, getCategoryBreakdown, getDailyBudgetStats }
}
