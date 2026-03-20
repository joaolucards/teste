'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Field, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { CurrencyInput } from '@/components/shared/currency-input'
import { DatePicker } from '@/components/shared/date-picker'
import { CategoryIcon } from '@/components/shared/category-icon'
import type { Transaction, Category, PaymentMethod, RecurrenceType } from '@/lib/types'
import { generateId, toISODateString, parseISODate } from '@/lib/utils'
import { CreditCard, Banknote, Repeat, ChevronLeft, CalendarDays, Calendar, Layers, StopCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type EditScope = 'all' | 'from-date' | 'this-only' | 'stop-from-date'

export interface SaveScopeInfo {
  type: EditScope
  date: string
}

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (transaction: Transaction, scopeInfo?: SaveScopeInfo) => void
  transaction?: Transaction
  categories: Category[]
  defaultDate?: Date
  defaultType?: 'income' | 'expense'
  /** Data da ocorrência específica que está sendo editada (vinda do calendário) */
  occurrenceDate?: string
}

export function TransactionForm({
  open,
  onOpenChange,
  onSave,
  transaction,
  categories,
  defaultDate,
  defaultType = 'expense',
  occurrenceDate,
}: TransactionFormProps) {
  const [type, setType] = useState<'income' | 'expense'>(transaction?.type || defaultType)
  const [amount, setAmount] = useState(transaction?.amount || 0)
  const [title, setTitle] = useState(transaction?.title || '')
  const [notes, setNotes] = useState(transaction?.notes || '')
  const [categoryId, setCategoryId] = useState(transaction?.categoryId || '')
  const [date, setDate] = useState<Date | undefined>(
    transaction?.date ? new Date(transaction.date) : defaultDate || new Date()
  )
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    transaction?.paymentMethod || 'debit'
  )
  const [effectiveDate, setEffectiveDate] = useState<Date | undefined>(
    transaction?.effectiveDate ? new Date(transaction.effectiveDate) : undefined
  )
  const [isRecurring, setIsRecurring] = useState(
    transaction?.recurrence.type !== 'none'
  )
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
    transaction?.recurrence.type || 'monthly'
  )
  const [customInterval, setCustomInterval] = useState(
    transaction?.recurrence.interval || 30
  )
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(
    transaction?.recurrence.endDate ? new Date(transaction.recurrence.endDate) : undefined
  )

  // Estado do seletor de escopo (aparece ao salvar uma transação recorrente em edição)
  const [formStep, setFormStep] = useState<'edit' | 'scope'>('edit')
  const [pendingTransaction, setPendingTransaction] = useState<Transaction | null>(null)
  const [editScope, setEditScope] = useState<EditScope>('all')
  const [scopeDate, setScopeDate] = useState<Date | undefined>()

  const isEditing = !!transaction
  const isEditingRecurring = isEditing && transaction?.recurrence.type !== 'none'

  useEffect(() => {
    if (open) {
      setFormStep('edit')
      setPendingTransaction(null)
      if (transaction) {
        setType(transaction.type)
        setAmount(transaction.amount)
        setTitle(transaction.title || '')
        setNotes(transaction.notes || '')
        setCategoryId(transaction.categoryId)
        setDate(parseISODate(transaction.date))
        setPaymentMethod(transaction.paymentMethod || 'debit')
        setEffectiveDate(transaction.effectiveDate ? parseISODate(transaction.effectiveDate) : undefined)
        setIsRecurring(transaction.recurrence.type !== 'none')
        setRecurrenceType(transaction.recurrence.type === 'none' ? 'monthly' : transaction.recurrence.type)
        setCustomInterval(transaction.recurrence.interval || 30)
        setRecurrenceEndDate(transaction.recurrence.endDate ? parseISODate(transaction.recurrence.endDate) : undefined)
        // Pré-selecionar escopo se veio do calendário
        if (occurrenceDate) {
          setEditScope('this-only')
          setScopeDate(parseISODate(occurrenceDate))
        } else {
          setEditScope('all')
          setScopeDate(undefined)
        }
      } else {
        setType(defaultType)
        setAmount(0)
        setTitle('')
        setNotes('')
        setCategoryId('')
        setDate(defaultDate || new Date())
        setPaymentMethod('debit')
        setEffectiveDate(undefined)
        setIsRecurring(false)
        setRecurrenceType('monthly')
        setCustomInterval(30)
        setRecurrenceEndDate(undefined)
      }
    }
  }, [open, transaction, defaultDate, defaultType, occurrenceDate])

  const filteredCategories = categories.filter(c => c.type === type)

  useEffect(() => {
    if (!filteredCategories.find(c => c.id === categoryId)) {
      setCategoryId(filteredCategories[0]?.id || '')
    }
  }, [type, filteredCategories, categoryId])

  useEffect(() => {
    if (paymentMethod === 'debit' && date) {
      setEffectiveDate(date)
    }
  }, [paymentMethod, date])

  const buildTransaction = (): Transaction => ({
    id: transaction?.id || generateId(),
    type,
    amount,
    categoryId,
    title: title.trim(),
    notes: notes.trim() || undefined,
    date: toISODateString(date!),
    effectiveDate: toISODateString(
      type === 'expense' && paymentMethod === 'credit' && effectiveDate
        ? effectiveDate
        : date!
    ),
    paymentMethod: type === 'expense' ? paymentMethod : undefined,
    recurrence: isRecurring
      ? {
          type: recurrenceType,
          interval: recurrenceType === 'custom' ? customInterval : undefined,
          endDate: recurrenceEndDate ? toISODateString(recurrenceEndDate) : undefined,
        }
      : { type: 'none' },
    overrides: transaction?.overrides ?? [],
    createdAt: transaction?.createdAt || new Date().toISOString(),
  })

  const handleSave = () => {
    if (!amount || !categoryId || !date) return

    const newTransaction = buildTransaction()

    // Se estiver editando uma recorrente, precisamos perguntar o escopo
    if (isEditingRecurring) {
      setPendingTransaction(newTransaction)
      // Pré-preenche a data do escopo
      if (!scopeDate) {
        setScopeDate(occurrenceDate ? parseISODate(occurrenceDate) : date)
      }
      setFormStep('scope')
    } else {
      onSave(newTransaction)
      onOpenChange(false)
      resetForm()
    }
  }

  const handleConfirmScope = () => {
    if (!pendingTransaction) return
    const finalScopeDate = scopeDate ? toISODateString(scopeDate) : toISODateString(date!)
    onSave(pendingTransaction, { type: editScope, date: finalScopeDate })
    setFormStep('edit')
    setPendingTransaction(null)
    onOpenChange(false)
    resetForm()
  }

  const resetForm = () => {
    if (!transaction) {
      setType('expense')
      setAmount(0)
      setDescription('')
      setCategoryId('')
      setDate(new Date())
      setPaymentMethod('debit')
      setEffectiveDate(undefined)
      setIsRecurring(false)
      setRecurrenceType('monthly')
      setCustomInterval(30)
      setRecurrenceEndDate(undefined)
    }
  }

  const selectedCategory = categories.find(c => c.id === categoryId)

  return (
    <Sheet open={open} onOpenChange={(v) => {
      if (!v) setFormStep('edit')
      onOpenChange(v)
    }}>
      <SheetContent className="overflow-y-auto px-6">
        {/* ── Etapa 1: Formulário ── */}
        {formStep === 'edit' && (
          <>
            <SheetHeader>
              <SheetTitle>
                {isEditing ? 'Editar Transação' : 'Nova Transação'}
              </SheetTitle>
              <SheetDescription>
                {isEditing
                  ? 'Altere os dados da transação'
                  : 'Registre uma nova receita ou despesa'
                }
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <Tabs value={type} onValueChange={(v) => setType(v as 'income' | 'expense')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="expense" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                    Despesa
                  </TabsTrigger>
                  <TabsTrigger value="income" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                    Receita
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Field>
                <FieldLabel>Valor</FieldLabel>
                <CurrencyInput value={amount} onChange={setAmount} />
              </Field>

              <Field>
                <FieldLabel>Título</FieldLabel>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Supermercado, Salário..."
                />
              </Field>

              <Field>
                <FieldLabel>Notas <span className="text-xs text-muted-foreground font-normal">(opcional)</span></FieldLabel>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalhes adicionais..."
                  className="resize-none"
                  rows={2}
                />
              </Field>

              <Field>
                <FieldLabel>Categoria</FieldLabel>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria">
                      {selectedCategory && (
                        <div className="flex items-center gap-2">
                          <CategoryIcon icon={selectedCategory.icon} color={selectedCategory.color} />
                          {selectedCategory.name}
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <CategoryIcon icon={cat.icon} color={cat.color} />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Data</FieldLabel>
                <DatePicker date={date} onSelect={setDate} />
              </Field>

              {type === 'expense' && (
                <Field>
                  <FieldLabel>Forma de Pagamento</FieldLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('debit')}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-lg border p-3 transition-colors",
                        paymentMethod === 'debit'
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Banknote className="h-4 w-4" />
                      <span className="text-sm font-medium">Débito</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('credit')}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-lg border p-3 transition-colors",
                        paymentMethod === 'credit'
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm font-medium">Crédito</span>
                    </button>
                  </div>
                </Field>
              )}

              {type === 'expense' && paymentMethod === 'credit' && (
                <Field>
                  <FieldLabel>Data do Débito (Fatura)</FieldLabel>
                  <DatePicker
                    date={effectiveDate}
                    onSelect={setEffectiveDate}
                    placeholder="Quando será debitado?"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Data em que o valor será descontado da sua conta
                  </p>
                </Field>
              )}

              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Transação recorrente</span>
                  </div>
                  <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                </div>

                {isRecurring && (
                  <>
                    <Field>
                      <FieldLabel>Frequência</FieldLabel>
                      <Select value={recurrenceType} onValueChange={(v) => setRecurrenceType(v as RecurrenceType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diária</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal (mesmo dia do mês)</SelectItem>
                          <SelectItem value="custom">Personalizada (intervalo em dias)</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    {recurrenceType === 'custom' && (
                      <Field>
                        <FieldLabel>A cada quantos dias?</FieldLabel>
                        <Input
                          type="number"
                          min={1}
                          value={customInterval}
                          onChange={(e) => setCustomInterval(parseInt(e.target.value) || 1)}
                        />
                      </Field>
                    )}

                    {recurrenceType === 'monthly' && (
                      <p className="text-xs text-muted-foreground">
                        Será repetida todo mês no dia {date?.getDate() ?? '—'}.
                        Em meses mais curtos, usará o último dia disponível.
                      </p>
                    )}

                    <Field>
                      <FieldLabel>Data final (opcional)</FieldLabel>
                      <DatePicker
                        date={recurrenceEndDate}
                        onSelect={setRecurrenceEndDate}
                        placeholder="Sem data final"
                      />
                    </Field>

                  </>
                )}
              </div>
            </div>

            <SheetFooter className="mt-6">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!amount || !categoryId || !date}
                className={cn(
                  type === 'expense' && "bg-red-500 hover:bg-red-600",
                  type === 'income' && "bg-emerald-500 hover:bg-emerald-600"
                )}
              >
                {isEditingRecurring ? 'Continuar →' : isEditing ? 'Salvar' : 'Adicionar'}
              </Button>
            </SheetFooter>
          </>
        )}

        {/* ── Etapa 2: Escopo da edição (só para recorrentes) ── */}
        {formStep === 'scope' && (
          <>
            <SheetHeader>
              <SheetTitle>Como aplicar as alterações?</SheetTitle>
              <SheetDescription>
                Esta é uma transação recorrente. Escolha quais ocorrências serão afetadas.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-3">
              {/* Opção: Todas */}
              <button
                type="button"
                onClick={() => setEditScope('all')}
                className={cn(
                  "w-full flex items-start gap-4 rounded-lg border p-4 text-left transition-colors",
                  editScope === 'all'
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Layers className={cn("mt-0.5 h-5 w-5 shrink-0", editScope === 'all' ? "text-primary" : "text-muted-foreground")} />
                <div>
                  <p className="font-medium">Todas as ocorrências</p>
                  <p className="text-sm text-muted-foreground">
                    Altera o valor, categoria e descrição em toda a série recorrente
                  </p>
                </div>
              </button>

              {/* Opção: A partir de uma data */}
              <button
                type="button"
                onClick={() => setEditScope('from-date')}
                className={cn(
                  "w-full flex items-start gap-4 rounded-lg border p-4 text-left transition-colors",
                  editScope === 'from-date'
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <CalendarDays className={cn("mt-0.5 h-5 w-5 shrink-0", editScope === 'from-date' ? "text-primary" : "text-muted-foreground")} />
                <div className="flex-1">
                  <p className="font-medium">Esta e as próximas ocorrências</p>
                  <p className="text-sm text-muted-foreground">
                    Cria uma nova série a partir da data escolhida (útil para reajustes)
                  </p>
                  {editScope === 'from-date' && (
                    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                      <DatePicker
                        date={scopeDate}
                        onSelect={setScopeDate}
                        placeholder="A partir de quando?"
                      />
                    </div>
                  )}
                </div>
              </button>

              {/* Opção: Apenas esta ocorrência */}
              <button
                type="button"
                onClick={() => setEditScope('this-only')}
                className={cn(
                  "w-full flex items-start gap-4 rounded-lg border p-4 text-left transition-colors",
                  editScope === 'this-only'
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Calendar className={cn("mt-0.5 h-5 w-5 shrink-0", editScope === 'this-only' ? "text-primary" : "text-muted-foreground")} />
                <div className="flex-1">
                  <p className="font-medium">Apenas uma ocorrência específica</p>
                  <p className="text-sm text-muted-foreground">
                    Altera somente o mês/data escolhido, sem afetar os demais
                  </p>
                  {editScope === 'this-only' && (
                    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                      <DatePicker
                        date={scopeDate}
                        onSelect={setScopeDate}
                        placeholder="Qual ocorrência?"
                      />
                    </div>
                  )}
                </div>
              </button>

              {/* Opção: Encerrar recorrência a partir de uma data */}
              <button
                type="button"
                onClick={() => setEditScope('stop-from-date')}
                className={cn(
                  "w-full flex items-start gap-4 rounded-lg border p-4 text-left transition-colors",
                  editScope === 'stop-from-date'
                    ? "border-destructive bg-destructive/5"
                    : "border-border hover:border-destructive/50"
                )}
              >
                <StopCircle className={cn("mt-0.5 h-5 w-5 shrink-0", editScope === 'stop-from-date' ? "text-destructive" : "text-muted-foreground")} />
                <div className="flex-1">
                  <p className="font-medium">Encerrar recorrência a partir de uma data</p>
                  <p className="text-sm text-muted-foreground">
                    Para de repetir a partir do mês escolhido, mantendo as ocorrências anteriores
                  </p>
                  {editScope === 'stop-from-date' && (
                    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                      <DatePicker
                        date={scopeDate}
                        onSelect={setScopeDate}
                        placeholder="Encerrar a partir de quando?"
                      />
                    </div>
                  )}
                </div>
              </button>
            </div>

            <SheetFooter className="mt-6">
              <Button variant="outline" onClick={() => setFormStep('edit')}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Voltar
              </Button>
              <Button
                onClick={handleConfirmScope}
                disabled={
                  (editScope !== 'all' && !scopeDate)
                }

              >
                Confirmar
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
