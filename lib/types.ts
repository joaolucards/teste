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
  interval?: number // dias entre recorrências (para custom)
  endDate?: string // data final (opcional)
}

// Override de uma ocorrência específica de uma transação recorrente
export interface RecurrenceOverride {
  date: string // ISO date da ocorrência que está sendo sobrescrita
  amount?: number
  title?: string
  notes?: string
  categoryId?: string
  effectiveDate?: string
  paymentMethod?: PaymentMethod
  skip?: boolean // true = pular esta ocorrência
}

export interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  categoryId: string
  /** Título curto exibido no card */
  title: string
  /** Notas/detalhamento exibido via tooltip */
  notes?: string
  date: string // data da transação (ISO string)
  effectiveDate: string // data do débito efetivo (para crédito)
  paymentMethod?: PaymentMethod // apenas para expenses
  recurrence: Recurrence
  overrides?: RecurrenceOverride[] // ajustes por ocorrência
  /**
   * Quando true, esta é a transação de "Gasto Diário" — única no sistema.
   * Fica oculta no grid do calendário se for a única transação do dia,
   * mas entra na conta quando há outras transações.
   */
  isDailyBudget?: boolean
  createdAt: string
}

// Configurações da conta
export interface AccountSettings {
  initialBalance: number
  currency: 'BRL'
}

// Estado do app
export interface FinanceState {
  transactions: Transaction[]
  categories: Category[]
  settings: AccountSettings
}

// Transação expandida (com recorrências calculadas)
export interface ExpandedTransaction extends Omit<Transaction, 'recurrence' | 'overrides'> {
  isRecurrence: boolean
  originalId?: string
  occurrenceDate: string // data original desta ocorrência (antes de override de effectiveDate)
}
