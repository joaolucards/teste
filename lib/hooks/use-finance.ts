'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Transaction, Category, AccountSettings, ExpandedTransaction, RecurrenceOverride, DailyBudgetSettings, DailyBudgetOverride, Vault, VaultTransaction, ExpandedVaultTransaction } from '../types'
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

  const saveDefault = useCallback(async (
    defaultAmount: number,
    defaultFrom: string,
    defaultNotes?: string,
  ) => {
    if (!user) return
    try {
      await fs.saveDefaultDailyBudget(user.uid, defaultAmount, defaultFrom, defaultNotes)
    } catch (err) {
      console.error('Erro ao salvar padrão diário:', err)
      toast.error('Erro ao salvar. Tente novamente.')
    }
  }, [user])

  return { settings, saveOverride, saveDefault }
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
// ─── Vaults ───────────────────────────────────────────────────────────────────

function expandVaultTransactions(
  txs: VaultTransaction[],
  startDate: Date,
  endDate: Date,
): ExpandedVaultTransaction[] {
  const expanded: ExpandedVaultTransaction[] = []
  for (const tx of txs) {
    const baseDate = parseISODate(tx.effectiveDate)
    if (tx.recurrence.type === 'none') {
      if (baseDate >= startDate && baseDate <= endDate)
        expanded.push({ ...tx, occurrenceDate: tx.effectiveDate, isRecurrence: false })
      continue
    }
    const recurrenceEnd = tx.recurrence.endDate ? parseISODate(tx.recurrence.endDate) : endDate
    let n = 0
    while (true) {
      const occurrence = getNthOccurrence(baseDate, tx as unknown as Transaction, n)
      if (occurrence > endDate || occurrence > recurrenceEnd) break
      const dateStr = toISODateString(occurrence)
      const override = tx.overrides?.find(o => o.date === dateStr)
      if (!override?.skip && occurrence >= startDate) {
        expanded.push({
          ...tx,
          amount: override?.amount ?? tx.amount,
          id: n === 0 ? tx.id : `${tx.id}-${dateStr}`,
          date: dateStr,
          effectiveDate: dateStr,
          occurrenceDate: dateStr,
          isRecurrence: n !== 0,
          originalId: n !== 0 ? tx.id : undefined,
        })
      }
      n++
    }
  }
  return expanded.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export function useVaults() {
  const { user } = useAuth()
  const [vaults, setVaults] = useState<Vault[]>([])
  const [vaultTransactions, setVaultTransactions] = useState<Record<string, VaultTransaction[]>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) { setVaults([]); setVaultTransactions({}); setIsLoading(false); return }
    setIsLoading(true)
    const unsubs: (() => void)[] = []
    const vaultUnsub = fs.subscribeVaults(user.uid, (v) => {
      setVaults(v)
      setIsLoading(false)
      v.forEach(vault => {
        const txUnsub = fs.subscribeVaultTransactions(user.uid, vault.id, (txs) => {
          setVaultTransactions(prev => ({ ...prev, [vault.id]: txs }))
        })
        unsubs.push(txUnsub)
      })
    })
    unsubs.push(vaultUnsub)
    return () => unsubs.forEach(u => u())
  }, [user])

  const addVault = useCallback(async (vault: Vault) => {
    if (!user) return
    try { await fs.addVault(user.uid, vault) }
    catch (err) { console.error(err); toast.error('Erro ao criar cofrinho.') }
  }, [user])

  const updateVault = useCallback(async (id: string, updates: Partial<Vault>) => {
    if (!user) return
    try { await fs.updateVault(user.uid, id, updates) }
    catch (err) { console.error(err); toast.error('Erro ao atualizar cofrinho.') }
  }, [user])

  const removeVault = useCallback(async (id: string) => {
    if (!user) return
    try { await fs.deleteVault(user.uid, id) }
    catch (err) { console.error(err); toast.error('Erro ao excluir cofrinho.') }
  }, [user])

  const addVaultTransaction = useCallback(async (tx: VaultTransaction) => {
    if (!user) return
    try { await fs.addVaultTransaction(user.uid, tx) }
    catch (err) { console.error(err); toast.error('Erro ao registrar movimentação.') }
  }, [user])

  const updateVaultTransaction = useCallback(async (vaultId: string, txId: string, updates: Partial<VaultTransaction>) => {
    if (!user) return
    try { await fs.updateVaultTransaction(user.uid, vaultId, txId, updates) }
    catch (err) { console.error(err); toast.error('Erro ao atualizar movimentação.') }
  }, [user])

  const removeVaultTransaction = useCallback(async (vaultId: string, txId: string) => {
    if (!user) return
    try { await fs.deleteVaultTransaction(user.uid, vaultId, txId) }
    catch (err) { console.error(err); toast.error('Erro ao remover movimentação.') }
  }, [user])

  const getVaultBalances = useCallback((): Record<string, number> => {
    const today = new Date()
    const farPast = new Date(2000, 0, 1)
    const balances: Record<string, number> = {}
    for (const vault of vaults) {
      const txs = vaultTransactions[vault.id] ?? []
      const expanded = expandVaultTransactions(txs, farPast, today)
      balances[vault.id] = expanded.reduce((sum, tx) =>
        tx.type === 'deposit' ? sum + tx.amount : sum - tx.amount, 0)
    }
    return balances
  }, [vaults, vaultTransactions])

  const getTotalVaulted = useCallback((): number => {
    const balances = getVaultBalances()
    return Object.values(balances).reduce((s, b) => s + Math.max(0, b), 0)
  }, [getVaultBalances])

  return {
    vaults, vaultTransactions, isLoading,
    addVault, updateVault, removeVault,
    addVaultTransaction, updateVaultTransaction, removeVaultTransaction,
    getVaultBalances, getTotalVaulted,
  }
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
  totalVaulted = 0,
  vaultData?: { vaults: Vault[]; vaultTransactions: Record<string, VaultTransaction[]> },
) {
  const currentBalance = useMemo(() => {
    const today = toISODateString(new Date())
    const txBalance = transactions.reduce((bal, tx) => {
      if (tx.effectiveDate <= today) {
        return tx.type === 'income' ? bal + tx.amount : bal - tx.amount
      }
      return bal
    }, initialBalance)
    // Subtract daily budget amounts up to today
    const overrideTotal = (dailyBudgetSettings?.overrides ?? [])
      .filter(o => o.date <= today)
      .reduce((s, o) => s + o.amount, 0)

    // Count days covered by default (from defaultFrom to today, excluding days with overrides)
    let defaultTotal = 0
    if (dailyBudgetSettings?.defaultAmount && dailyBudgetSettings.defaultFrom) {
      const start = dailyBudgetSettings.defaultFrom
      const overrideDates = new Set((dailyBudgetSettings.overrides ?? []).map(o => o.date))
      const startD = new Date(start + 'T00:00:00')
      const todayD = new Date(today + 'T00:00:00')
      for (let d = new Date(startD); d <= todayD; d.setDate(d.getDate() + 1)) {
        const ds = toISODateString(d)
        if (!overrideDates.has(ds)) {
          defaultTotal += dailyBudgetSettings.defaultAmount
        }
      }
    }
    return txBalance - overrideTotal - defaultTotal - totalVaulted
  }, [transactions, initialBalance, dailyBudgetSettings, totalVaulted])

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
      // Include daily budget for this date (override > default > 0)
      const dbOverride = dailyBudgetSettings?.overrides.find(o => o.date === date)
      if (dbOverride) {
        if (dbOverride.amount > 0) running -= dbOverride.amount
      } else if (
        dailyBudgetSettings?.defaultAmount &&
        dailyBudgetSettings.defaultFrom &&
        date >= dailyBudgetSettings.defaultFrom
      ) {
        running -= dailyBudgetSettings.defaultAmount
      }
      // Vault movements for this day
      if (vaultData) {
        for (const vault of vaultData.vaults) {
          const vtxs = vaultData.vaultTransactions[vault.id] ?? []
          for (const vtx of vtxs) {
            const base = parseISODate(vtx.effectiveDate)
            let matches = false
            if (vtx.recurrence.type === 'none') {
              matches = vtx.effectiveDate === date
            } else {
              const recEnd = vtx.recurrence.endDate ? parseISODate(vtx.recurrence.endDate) : addDays(new Date(), days + 1)
              let n = 0
              while (true) {
                const occ = getNthOccurrence(base, vtx as unknown as Transaction, n)
                if (occ > recEnd) break
                if (toISODateString(occ) === date) { matches = true; break }
                if (toISODateString(occ) > date) break
                n++
              }
            }
            if (matches) {
              running = vtx.type === 'deposit' ? running - vtx.amount : running + vtx.amount
            }
          }
        }
      }

      forecast.push({ date, balance: running, transactions: dayTxs })
    }
    return forecast
  }, [transactions, currentBalance, dailyBudgetSettings, vaultData])

  const getTransactionsForDate = useCallback((date: Date) => {
    const s = new Date(date); s.setHours(0, 0, 0, 0)
    const e = new Date(date); e.setHours(23, 59, 59, 999)
    const regular = expandRecurrences(transactions, s, e)

    // Inject synthetic daily budget entry
    const dateStr = toISODateString(new Date(date))
    const override = dailyBudgetSettings?.overrides.find(o => o.date === dateStr)
    const hasDefault =
      dailyBudgetSettings?.defaultAmount !== undefined &&
      dailyBudgetSettings.defaultFrom &&
      dateStr >= dailyBudgetSettings.defaultFrom
    const resolvedAmount = override?.amount ?? (hasDefault ? dailyBudgetSettings!.defaultAmount! : 0)
    const resolvedNotes = override?.notes ?? (hasDefault ? dailyBudgetSettings!.defaultNotes : undefined)

    const dailyEntry: ExpandedTransaction = {
      id: `${DAILY_BUDGET_ID}-${dateStr}`,
      originalId: DAILY_BUDGET_ID,
      type: 'expense',
      amount: resolvedAmount,
      categoryId: '',
      title: 'Gasto Diário',
      notes: resolvedNotes,
      date: dateStr,
      effectiveDate: dateStr,
      occurrenceDate: dateStr,
      isRecurrence: true,
      isDailyBudget: true,
      createdAt: '',
    }

    // Inject expanded vault transactions for this date
    const vaultEntries: ExpandedTransaction[] = []
    if (vaultData) {
      for (const vault of vaultData.vaults) {
        const vtxs = vaultData.vaultTransactions[vault.id] ?? []
        const expanded = vtxs.flatMap(tx => {
          const base = parseISODate(tx.effectiveDate)
          if (tx.recurrence.type === 'none') {
            if (tx.effectiveDate === dateStr) {
              return [{
                id: tx.id,
                originalId: tx.id,
                type: 'expense' as const,
                amount: tx.amount,
                categoryId: '',
                title: `${tx.type === 'deposit' ? '↓' : '↑'} ${vault.name}: ${tx.title}`,
                notes: tx.notes,
                date: dateStr,
                effectiveDate: dateStr,
                occurrenceDate: dateStr,
                isRecurrence: false,
                isVaultEntry: true,
                vaultId: vault.id,
                vaultTxId: tx.id,
                vaultTxType: tx.type,
                createdAt: tx.createdAt,
              }]
            }
            return []
          }
          // Recurring: find if this date is an occurrence
          const recurrenceEnd = tx.recurrence.endDate ? parseISODate(tx.recurrence.endDate) : new Date(2100, 0, 1)
          let n = 0
          while (true) {
            const occ = getNthOccurrence(base, tx as unknown as Transaction, n)
            if (toISODateString(occ) === dateStr) {
              const override = tx.overrides?.find(o => o.date === dateStr)
              if (!override?.skip) {
                return [{
                  id: n === 0 ? tx.id : `${tx.id}-${dateStr}`,
                  originalId: tx.id,
                  type: 'expense' as const,
                  amount: override?.amount ?? tx.amount,
                  categoryId: '',
                  title: `${tx.type === 'deposit' ? '↓' : '↑'} ${vault.name}: ${tx.title}`,
                  notes: tx.notes,
                  date: dateStr,
                  effectiveDate: dateStr,
                  occurrenceDate: dateStr,
                  isRecurrence: n !== 0,
                  isVaultEntry: true,
                  vaultId: vault.id,
                  vaultTxId: tx.id,
                  vaultTxType: tx.type,
                  createdAt: tx.createdAt,
                }]
              }
              break
            }
            if (occ > new Date(dateStr + 'T23:59:59') || occ > recurrenceEnd) break
            n++
          }
          return []
        })
        vaultEntries.push(...expanded)
      }
    }

    return [...regular, dailyEntry, ...vaultEntries]
  }, [transactions, dailyBudgetSettings, vaultData])

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
      const overrideTotal2 = (dailyBudgetSettings?.overrides ?? [])
        .filter(o => o.date <= str)
        .reduce((s, o) => s + o.amount, 0)
      let defaultTotal2 = 0
      if (dailyBudgetSettings?.defaultAmount && dailyBudgetSettings.defaultFrom) {
        const overrideDates2 = new Set((dailyBudgetSettings.overrides ?? []).map(o => o.date))
        const startD2 = parseISODate(dailyBudgetSettings.defaultFrom)
        const targetD2 = parseISODate(str)
        for (let d = new Date(startD2); d <= targetD2; d.setDate(d.getDate() + 1)) {
          const ds = toISODateString(d)
          if (!overrideDates2.has(ds)) {
            defaultTotal2 += dailyBudgetSettings.defaultAmount
          }
        }
      }
      // Vault movements up to target date
      let vaultTotal2 = 0
      if (vaultData) {
        const farPast = new Date(2000, 0, 1)
        const targetD3 = parseISODate(str)
        for (const vault of vaultData.vaults) {
          const vtxs = vaultData.vaultTransactions[vault.id] ?? []
          for (const vtx of vtxs) {
            const base = parseISODate(vtx.effectiveDate)
            if (vtx.recurrence.type === 'none') {
              if (vtx.effectiveDate <= str) {
                vaultTotal2 += vtx.type === 'deposit' ? vtx.amount : -vtx.amount
              }
            } else {
              const recEnd = vtx.recurrence.endDate ? parseISODate(vtx.recurrence.endDate) : targetD3
              let n = 0
              while (true) {
                const occ = getNthOccurrence(base, vtx as unknown as Transaction, n)
                if (occ > targetD3 || occ > recEnd) break
                vaultTotal2 += vtx.type === 'deposit' ? vtx.amount : -vtx.amount
                n++
              }
            }
          }
        }
      }
      return txBal - overrideTotal2 - defaultTotal2 - vaultTotal2
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
    const settings = dailyBudgetSettings
    const today = new Date()
    const todayStr = toISODateString(today)
    const WINDOW = 30 // days to average over

    let total = 0
    for (let i = 0; i < WINDOW; i++) {
      const d = toISODateString(addDays(today, -i))
      // Specific override takes priority
      const override = settings?.overrides.find(o => o.date === d)
      if (override) {
        total += override.amount
      } else if (
        settings?.defaultAmount !== undefined &&
        settings.defaultFrom &&
        d >= settings.defaultFrom
      ) {
        // Default value applies to this day
        total += settings.defaultAmount
      }
      // else: no data for this day → contributes 0
    }

    const avgDaily = total / WINDOW
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    return { avgDaily, avgMonthly: avgDaily * daysInMonth }
  }, [dailyBudgetSettings])

  return { currentBalance, getForecast, getTransactionsForDate, getBalanceForDate, getMonthSummary, getCategoryBreakdown, getDailyBudgetStats }
}
