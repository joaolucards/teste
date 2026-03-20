/**
 * Camada de acesso ao Firestore.
 * Estrutura de dados:
 *   users/{userId}/transactions/{txId}
 *   users/{userId}/categories/{catId}
 *   users/{userId}/settings/main
 */
import {
  collection, doc, getDoc, getDocs,
  setDoc, updateDoc, deleteDoc,
  writeBatch, onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Transaction, Category, AccountSettings, RecurrenceOverride, DailyBudgetSettings, DailyBudgetOverride } from './types'
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from './constants'
import { generateId, toISODateString, parseISODate, addDays } from './utils'

/**
 * Firestore não aceita campos com valor `undefined`.
 * JSON.stringify já remove chaves undefined automaticamente — usamos isso.
 */
function stripUndefined<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// ─── helpers de path ───────────────────────────────────────────────

function txCol(uid: string)       { return collection(db, 'users', uid, 'transactions') }
function txDoc(uid: string, id: string) { return doc(db, 'users', uid, 'transactions', id) }
function catCol(uid: string)      { return collection(db, 'users', uid, 'categories') }
function catDoc(uid: string, id: string) { return doc(db, 'users', uid, 'categories', id) }
function settingsDoc(uid: string) { return doc(db, 'users', uid, 'settings', 'main') }
function dailyBudgetDoc(uid: string) { return doc(db, 'users', uid, 'settings', 'dailyBudget') }

// ─── Transactions ───────────────────────────────────────────────────

export function subscribeTransactions(
  uid: string,
  onChange: (txs: Transaction[]) => void
): Unsubscribe {
  return onSnapshot(txCol(uid), snap => {
    onChange(snap.docs.map(d => d.data() as Transaction))
  })
}

export async function addTransaction(uid: string, tx: Transaction): Promise<void> {
  await setDoc(txDoc(uid, tx.id), stripUndefined(tx))
}

export async function updateTransaction(
  uid: string, id: string, updates: Partial<Transaction>
): Promise<void> {
  // Busca o documento atual e faz merge para garantir que campos aninhados
  // com undefined (ex: recurrence.interval) não quebrem o Firestore
  const snap = await getDoc(txDoc(uid, id))
  if (!snap.exists()) return
  const current = snap.data() as Transaction
  const merged = stripUndefined({ ...current, ...updates })
  await setDoc(txDoc(uid, id), merged)
}

export async function deleteTransaction(uid: string, id: string): Promise<void> {
  await deleteDoc(txDoc(uid, id))
}

export async function splitTransactionFromDate(
  uid: string,
  id: string,
  fromDate: string,
  updates: Partial<Transaction>
): Promise<void> {
  const snap = await getDoc(txDoc(uid, id))
  if (!snap.exists()) return

  const original = snap.data() as Transaction
  const fromDateObj = parseISODate(fromDate)
  const newEndDate  = toISODateString(addDays(fromDateObj, -1))

  const batch = writeBatch(db)

  // Fecha a série original antes de fromDate
  batch.update(txDoc(uid, id), {
    recurrence: { ...original.recurrence, endDate: newEndDate },
  })

  // Nova série a partir de fromDate
  const newId = generateId()
  const newTx: Transaction = {
    ...original,
    ...updates,
    id: newId,
    date: fromDate,
    effectiveDate: fromDate,
    recurrence: {
      ...original.recurrence,
      ...(updates.recurrence ?? {}),
      endDate: original.recurrence.endDate,
    },
    overrides: [],
    createdAt: new Date().toISOString(),
  }
  batch.set(txDoc(uid, newId), stripUndefined(newTx))

  await batch.commit()
}

/**
 * Exclui uma transação recorrente de acordo com o escopo escolhido pelo usuário.
 *
 * - 'all'       → exclui o documento inteiro (todas as ocorrências)
 * - 'this-only' → marca a ocorrência como skip via override
 * - 'from-date' → encerra a série no dia anterior a occurrenceDate
 */
export async function deleteRecurrenceScope(
  uid: string,
  id: string,
  scope: 'all' | 'this-only' | 'from-date',
  occurrenceDate: string,
): Promise<void> {
  if (scope === 'all') {
    await deleteDoc(txDoc(uid, id))
    return
  }

  const snap = await getDoc(txDoc(uid, id))
  if (!snap.exists()) return
  const tx = snap.data() as Transaction

  if (scope === 'this-only') {
    const overrides = [...(tx.overrides ?? [])]
    const idx = overrides.findIndex(o => o.date === occurrenceDate)
    const skipOverride: RecurrenceOverride = { date: occurrenceDate, skip: true }
    if (idx !== -1) overrides[idx] = skipOverride
    else overrides.push(skipOverride)
    await updateDoc(txDoc(uid, id), { overrides: stripUndefined(overrides) })
    return
  }

  // 'from-date': encerra a série no dia anterior à ocorrência selecionada
  if (scope === 'from-date') {
    const fromDateObj = parseISODate(occurrenceDate)
    const newEndDate = toISODateString(addDays(fromDateObj, -1))
    await updateDoc(txDoc(uid, id), {
      recurrence: stripUndefined({ ...tx.recurrence, endDate: newEndDate }),
    })
  }
}

export async function addRecurrenceOverride(
  uid: string,
  id: string,
  override: RecurrenceOverride
): Promise<void> {
  const snap = await getDoc(txDoc(uid, id))
  if (!snap.exists()) return

  const tx = snap.data() as Transaction
  const overrides = [...(tx.overrides ?? [])]
  const idx = overrides.findIndex(o => o.date === override.date)

  if (idx !== -1) overrides[idx] = override
  else overrides.push(override)

  await updateDoc(txDoc(uid, id), { overrides: stripUndefined(overrides) })
}

// ─── Daily Budget ────────────────────────────────────────────────────────────

export function subscribeDailyBudget(
  uid: string,
  onChange: (settings: DailyBudgetSettings) => void
): Unsubscribe {
  return onSnapshot(dailyBudgetDoc(uid), snap => {
    onChange(snap.exists() ? (snap.data() as DailyBudgetSettings) : { overrides: [] })
  })
}

export async function saveDailyBudgetOverride(
  uid: string,
  override: DailyBudgetOverride
): Promise<void> {
  const snap = await getDoc(dailyBudgetDoc(uid))
  const current: DailyBudgetSettings = snap.exists()
    ? (snap.data() as DailyBudgetSettings)
    : { overrides: [] }
  const overrides = [...current.overrides]
  const idx = overrides.findIndex(o => o.date === override.date)
  if (idx !== -1) overrides[idx] = stripUndefined(override)
  else overrides.push(stripUndefined(override))
  await setDoc(dailyBudgetDoc(uid), { overrides })
}

// ─── Categories ─────────────────────────────────────────────────────

export function subscribeCategories(
  uid: string,
  onChange: (cats: Category[]) => void
): Unsubscribe {
  return onSnapshot(catCol(uid), snap => {
    onChange(snap.docs.map(d => d.data() as Category))
  })
}

export async function ensureDefaultCategories(uid: string): Promise<void> {
  const snap = await getDocs(catCol(uid))
  if (snap.empty) {
    const batch = writeBatch(db)
    for (const cat of DEFAULT_CATEGORIES) {
      batch.set(catDoc(uid, cat.id), stripUndefined(cat))
    }
    await batch.commit()
  }
}

export async function addCategory(uid: string, cat: Category): Promise<void> {
  await setDoc(catDoc(uid, cat.id), stripUndefined(cat))
}

export async function updateCategory(
  uid: string, id: string, updates: Partial<Category>
): Promise<void> {
  await updateDoc(catDoc(uid, id), updates as Record<string, unknown>)
}

export async function deleteCategory(uid: string, id: string): Promise<void> {
  const snap = await getDoc(catDoc(uid, id))
  if (!snap.exists()) return
  const cat = snap.data() as Category
  if (cat.isDefault) return   // categorias padrão não podem ser removidas
  await deleteDoc(catDoc(uid, id))
}

// ─── Settings ────────────────────────────────────────────────────────

export async function getSettings(uid: string): Promise<AccountSettings> {
  const snap = await getDoc(settingsDoc(uid))
  return snap.exists() ? (snap.data() as AccountSettings) : DEFAULT_SETTINGS
}

export function subscribeSettings(
  uid: string,
  onChange: (s: AccountSettings) => void
): Unsubscribe {
  return onSnapshot(settingsDoc(uid), snap => {
    onChange(snap.exists() ? (snap.data() as AccountSettings) : DEFAULT_SETTINGS)
  })
}

export async function saveSettings(uid: string, settings: AccountSettings): Promise<void> {
  await setDoc(settingsDoc(uid), stripUndefined(settings))
}

// ─── Export / Import / Clear ─────────────────────────────────────────

export async function exportData(uid: string): Promise<string> {
  const [txSnap, catSnap, settingsSnap] = await Promise.all([
    getDocs(txCol(uid)),
    getDocs(catCol(uid)),
    getDoc(settingsDoc(uid)),
  ])
  return JSON.stringify({
    transactions: txSnap.docs.map(d => d.data()),
    categories:   catSnap.docs.map(d => d.data()),
    settings:     settingsSnap.exists() ? settingsSnap.data() : DEFAULT_SETTINGS,
  }, null, 2)
}

export async function importData(uid: string, jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString)
    const batch = writeBatch(db)

    if (Array.isArray(data.transactions)) {
      for (const tx of data.transactions as Transaction[]) {
        batch.set(txDoc(uid, tx.id), tx)
      }
    }
    if (Array.isArray(data.categories)) {
      for (const cat of data.categories as Category[]) {
        batch.set(catDoc(uid, cat.id), cat)
      }
    }
    if (data.settings) {
      batch.set(settingsDoc(uid), data.settings)
    }

    await batch.commit()
    return true
  } catch {
    return false
  }
}

export async function clearAllData(uid: string): Promise<void> {
  const [txSnap, catSnap] = await Promise.all([
    getDocs(txCol(uid)),
    getDocs(catCol(uid)),
  ])

  const batch = writeBatch(db)
  txSnap.docs.forEach(d => batch.delete(d.ref))
  catSnap.docs.forEach(d => batch.delete(d.ref))
  batch.delete(settingsDoc(uid))
  await batch.commit()
}
