import type { Category } from './types'

// Categorias padrão de despesas
export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'exp-food', name: 'Alimentação', type: 'expense', color: '#f97316', icon: 'utensils', isDefault: true },
  { id: 'exp-transport', name: 'Transporte', type: 'expense', color: '#3b82f6', icon: 'car', isDefault: true },
  { id: 'exp-housing', name: 'Moradia', type: 'expense', color: '#22c55e', icon: 'home', isDefault: true },
  { id: 'exp-health', name: 'Saúde', type: 'expense', color: '#ef4444', icon: 'heart-pulse', isDefault: true },
  { id: 'exp-leisure', name: 'Lazer', type: 'expense', color: '#8b5cf6', icon: 'gamepad-2', isDefault: true },
  { id: 'exp-education', name: 'Educação', type: 'expense', color: '#06b6d4', icon: 'graduation-cap', isDefault: true },
  { id: 'exp-shopping', name: 'Compras', type: 'expense', color: '#ec4899', icon: 'shopping-bag', isDefault: true },
  { id: 'exp-other', name: 'Outros', type: 'expense', color: '#6b7280', icon: 'ellipsis', isDefault: true },
]

// Categorias padrão de receitas
export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'inc-salary', name: 'Salário', type: 'income', color: '#22c55e', icon: 'wallet', isDefault: true },
  { id: 'inc-freelance', name: 'Freelance', type: 'income', color: '#3b82f6', icon: 'briefcase', isDefault: true },
  { id: 'inc-investment', name: 'Investimentos', type: 'income', color: '#eab308', icon: 'trending-up', isDefault: true },
  { id: 'inc-other', name: 'Outros', type: 'income', color: '#6b7280', icon: 'ellipsis', isDefault: true },
]

export const DEFAULT_CATEGORIES: Category[] = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
]

// Ícones disponíveis para categorias
export const AVAILABLE_ICONS = [
  'utensils', 'car', 'home', 'heart-pulse', 'gamepad-2', 'graduation-cap',
  'shopping-bag', 'wallet', 'briefcase', 'trending-up', 'ellipsis',
  'coffee', 'phone', 'wifi', 'music', 'film', 'plane', 'gift',
  'book', 'shirt', 'dumbbell', 'pill', 'baby', 'dog', 'cat',
  'credit-card', 'banknote', 'piggy-bank', 'receipt', 'calculator'
]

// Cores disponíveis para categorias
export const AVAILABLE_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
  '#f43f5e', '#6b7280', '#78716c', '#71717a', '#737373'
]

// Storage keys
export const STORAGE_KEYS = {
  TRANSACTIONS: 'finance_transactions',
  CATEGORIES: 'finance_categories',
  SETTINGS: 'finance_settings',
} as const

// Configurações padrão
export const DEFAULT_SETTINGS = {
  initialBalance: 0,
  currency: 'BRL' as const,
}
