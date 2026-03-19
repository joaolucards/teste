import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatação de moeda (BRL)
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Parse de valor de moeda
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

// Formatação de data
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', options ?? { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Formatação de data curta (dia/mês)
export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

// Gerar ID único
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// Obter data no formato ISO (apenas data, sem timezone)
// Usa getFullYear/getMonth/getDate para evitar problemas de timezone
export function toISODateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Criar data a partir de string ISO sem problemas de timezone
export function parseISODate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Adicionar dias a uma data
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// Adicionar meses a uma data, preservando o dia original (com clamping no último dia do mês)
// Ex: 31/jan + 1 mês = 28/fev (não 02/mar), 5/jan + 1 mês = 5/fev
export function addMonths(date: Date, months: number): Date {
  const originalDay = date.getDate()
  // Vai para o 1º do mês alvo para evitar overflow automático do JS
  const result = new Date(date.getFullYear(), date.getMonth() + months, 1)
  // Último dia do mês alvo
  const lastDayOfTargetMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()
  // Usa o dia original, mas clampado ao último dia disponível
  result.setDate(Math.min(originalDay, lastDayOfTargetMonth))
  return result
}

// Verificar se duas datas são o mesmo dia
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  return toISODateString(d1) === toISODateString(d2)
}

// Obter início do mês
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

// Obter fim do mês
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}
