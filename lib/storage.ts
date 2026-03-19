import {
  collection, doc, setDoc, updateDoc, deleteDoc,
  writeBatch, getDoc, getDocs,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Transaction, Category, AccountSettings, RecurrenceOverride } from './types'
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from './constants'
import { generateId, toISODateString, parseISODate, addDays } from './utils'

const txCol       = (uid: string) => collection(db, 'users', uid, 'transactions')
const catCol      = (uid: string) => collection(db, 'users', uid, 'categories')
const txDoc       = (uid: string, id: string) => doc(db, 'users', uid, 'transactions', id)
const catDoc      = (uid: string, id: string) => doc(db, 'users', uid, 'categories', id)
const settingsDoc = (uid: string) => doc(db, 'users', uid, 'settings', 'account')

// Bootstrap: chamado uma vez quando o usuário entra pela primeira vez
export async function initializeUserData(uid: string): Promise<void> {
  const snap = await getDocs(catCol(uid))
  if (!snap.empty) return

  const batch = writeBatch(db)
  for (const cat of DEFAULT_CATEGORIES) {
    batch.set(catDoc(uid, cat.id), cat)
  }
  batch.set(settingsDoc(uid), DEFAULT_SETTINGS)
  await batch.commit()
}

// Transactions
export async function addTransaction(uid: string, tx: Transaction): Promise<void> {
  await setDoc(txDoc(uid, tx.id), tx)
}

export async function updateTransaction(uid: string, id: string, updates: Partial<Transaction>): Promise<void> {
  await updateDoc(txDoc(uid, id), updates as Record<string, unknown>)
}

export async function deleteTransaction(uid: string, id: string): Promise<void> {
  await deleteDoc(txDoc(uid, id))
}

export async function splitTransactionFromDate(
  uid: string,
  id: string,
  fromDate: string,
  updates: Partial<Transaction>,
): Promise<void> {
  const snap = await getDoc(txDoc(uid, id))
  if (!snap.exists()) return

  const original = snap.data() as Transaction
  const fromDateObj = parseISODate(fromDate)
  const dayBefore = addDays(fromDateObj, -1)
  const newEndDate = toISODateString(dayBefore)

  const batch = writeBatch(db)
  batch.update(txDoc(uid, id), {
    recurrence: { ...original.recurrence, endDate: newEndDate },
  })

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
  batch.set(txDoc(uid, newId), newTx)
  await batch.commit()
}

export async function addRecurrenceOverride(
  uid: string,
  id: string,
  override: RecurrenceOverride,
): Promise<void> {
  const snap = await getDoc(txDoc(uid, id))
  if (!snap.exists()) return

  const tx = snap.data() as Transaction
  const overrides = [...(tx.overrides ?? [])]
  const idx = overrides.findIndex(o => o.date === override.date)
  if (idx !== -1) {
    overrides[idx] = override
  } else {
    overrides.push(override)
  }
  await updateDoc(txDoc(uid, id), { overrides })
}

// Categories
export async function addCategory(uid: string, cat: Category): Promise<void> {
  await setDoc(catDoc(uid, cat.id), cat)
}

export async function updateCategory(uid: string, id: string, updates: Partial<Category>): Promise<void> {
  await updateDoc(catDoc(uid, id), updates as Record<string, unknown>)
}

export async function deleteCategory(uid: string, id: string, isDefault: boolean): Promise<void> {
  if (isDefault) return
  await deleteDoc(catDoc(uid, id))
}

// Settings
export async function saveSettings(uid: string, settings: AccountSettings): Promise<void> {
  await setDoc(settingsDoc(uid), settings)
}

// Export / Import
export async function exportData(uid: string): Promise<string> {
  const [txSnap, catSnap, settSnap] = await Promise.all([
    getDocs(txCol(uid)),
    getDocs(catCol(uid)),
    getDoc(settingsDoc(uid)),
  ])
  return JSON.stringify({
    transactions: txSnap.docs.map(d => d.data()),
    categories:   catSnap.docs.map(d => d.data()),
    settings:     settSnap.exists() ? settSnap.data() : DEFAULT_SETTINGS,
  }, null, 2)
}

export async function importData(uid: string, jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString)
    const batch = writeBatch(db)
    if (data.transactions) {
      for (const tx of data.transactions as Transaction[]) {
        batch.set(txDoc(uid, tx.id), tx)
      }
    }
    if (data.categories) {
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
  for (const d of txSnap.docs)  batch.delete(d.ref)
  for (const d of catSnap.docs) batch.delete(d.ref)
  batch.delete(settingsDoc(uid))
  await batch.commit()
}
