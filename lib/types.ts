// Tipos de categoria
export type CategoryType = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  type: CategoryType
  color: string
  icon: string
  isDefault: boolean
}

// Tipos de transação
export type PaymentMethod = 'debit' | 'credit'
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom'

export interface Recurrence {
  type: RecurrenceType
  interval?: number
  endDate?: string
}

export interface RecurrenceOverride {
  date: string
  amount?: number
  title?: string
  notes?: string
  categoryId?: string
  effectiveDate?: string
  paymentMethod?: PaymentMethod
  skip?: boolean
}

export interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  categoryId: string
  title: string
  notes?: string
  date: string
  effectiveDate: string
  paymentMethod?: PaymentMethod
  recurrence: Recurrence
  overrides?: RecurrenceOverride[]
  createdAt: string
}

// Configurações da conta
export interface AccountSettings {
  initialBalance: number
  currency: 'BRL'
}

export interface FinanceState {
  transactions: Transaction[]
  categories: Category[]
  settings: AccountSettings
}

// Transação expandida (com recorrências calculadas)
export interface ExpandedTransaction extends Omit<Transaction, 'recurrence' | 'overrides'> {
  isRecurrence: boolean
  originalId?: string
  occurrenceDate: string
  /** true = esta entrada é o gasto diário sintético */
  isDailyBudget?: boolean
}

// Override de gasto diário por data
export interface DailyBudgetOverride {
  date: string   // ISO date
  amount: number
  notes?: string
}

// Configuração do gasto diário (salva no Firestore)
export interface DailyBudgetSettings {
  overrides: DailyBudgetOverride[]
}

// ─── Cofrinhos (Vaults) ───────────────────────────────────────────────────────

export interface Vault {
  id: string
  name: string
  color: string
  icon: string
  goal?: number      // meta de valor (opcional)
  createdAt: string
}

export type VaultTransactionType = 'deposit' | 'withdrawal'

export interface VaultTransaction {
  id: string
  vaultId: string
  type: VaultTransactionType
  amount: number
  title: string
  notes?: string
  date: string
  effectiveDate: string
  recurrence: Recurrence
  overrides?: RecurrenceOverride[]
  createdAt: string
}

// Vault transaction expandida (com recorrências)
export interface ExpandedVaultTransaction extends Omit<VaultTransaction, 'recurrence' | 'overrides'> {
  isRecurrence: boolean
  originalId?: string
  occurrenceDate: string
}
