'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CurrencyInput } from '@/components/shared/currency-input'
import { DatePicker } from '@/components/shared/date-picker'
import { generateId, toISODateString } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Vault, VaultTransaction, VaultTransactionType, RecurrenceType } from '@/lib/types'

interface VaultTransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vaults: Vault[]
  defaultVaultId?: string
  defaultType?: VaultTransactionType
  onSave: (tx: VaultTransaction) => void
}

export function VaultTransactionForm({
  open,
  onOpenChange,
  vaults,
  defaultVaultId,
  defaultType = 'deposit',
  onSave,
}: VaultTransactionFormProps) {
  const [type, setType] = useState<VaultTransactionType>(defaultType)
  const [vaultId, setVaultId] = useState(defaultVaultId || vaults[0]?.id || '')
  const [amount, setAmount] = useState(0)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('monthly')
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>()

  useEffect(() => {
    if (open) {
      setType(defaultType)
      setVaultId(defaultVaultId || vaults[0]?.id || '')
      setAmount(0)
      setTitle('')
      setNotes('')
      setDate(new Date())
      setIsRecurring(false)
      setRecurrenceType('monthly')
      setRecurrenceEndDate(undefined)
    }
  }, [open, defaultType, defaultVaultId, vaults])

  function handleSave() {
    if (!amount || !vaultId || !date) return
    const dateStr = toISODateString(date)
    const tx: VaultTransaction = {
      id: generateId(),
      vaultId,
      type,
      amount,
      title: title.trim() || (type === 'deposit' ? 'Depósito' : 'Resgate'),
      notes: notes.trim() || undefined,
      date: dateStr,
      effectiveDate: dateStr,
      recurrence: isRecurring
        ? {
            type: recurrenceType,
            endDate: recurrenceEndDate ? toISODateString(recurrenceEndDate) : undefined,
          }
        : { type: 'none' },
      overrides: [],
      createdAt: new Date().toISOString(),
    }
    onSave(tx)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto px-6">
        <SheetHeader>
          <SheetTitle>Movimentação de Cofrinho</SheetTitle>
          <SheetDescription>Depositar ou resgatar de um cofrinho</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Tipo */}
          <Tabs value={type} onValueChange={v => setType(v as VaultTransactionType)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="deposit"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                Guardar
              </TabsTrigger>
              <TabsTrigger
                value="withdrawal"
                className="data-[state=active]:bg-amber-500 data-[state=active]:text-white"
              >
                Resgatar
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Cofrinho */}
          <Field>
            <FieldLabel>Cofrinho</FieldLabel>
            <Select value={vaultId} onValueChange={setVaultId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cofrinho" />
              </SelectTrigger>
              <SelectContent>
                {vaults.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Valor */}
          <Field>
            <FieldLabel>Valor</FieldLabel>
            <CurrencyInput value={amount} onChange={setAmount} />
          </Field>

          {/* Título */}
          <Field>
            <FieldLabel>
              Título{' '}
              <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
            </FieldLabel>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={type === 'deposit' ? 'Ex: Aporte mensal' : 'Ex: Compra da passagem'}
            />
          </Field>

          {/* Notas */}
          <Field>
            <FieldLabel>
              Notas{' '}
              <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
            </FieldLabel>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Detalhes..."
              className="resize-none"
              rows={2}
            />
          </Field>

          {/* Data */}
          <Field>
            <FieldLabel>Data</FieldLabel>
            <DatePicker date={date} onSelect={setDate} />
          </Field>

          {/* Recorrência */}
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Recorrente</span>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>
            {isRecurring && (
              <>
                <Field>
                  <FieldLabel>Frequência</FieldLabel>
                  <Select value={recurrenceType} onValueChange={v => setRecurrenceType(v as RecurrenceType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diária</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Data final (opcional)</FieldLabel>
                  <DatePicker date={recurrenceEndDate} onSelect={setRecurrenceEndDate} placeholder="Sem data final" />
                </Field>
              </>
            )}
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSave}
            disabled={!amount || !vaultId}
            className={cn(
              type === 'deposit' && 'bg-blue-500 hover:bg-blue-600',
              type === 'withdrawal' && 'bg-amber-500 hover:bg-amber-600',
            )}
          >
            {type === 'deposit' ? 'Guardar' : 'Resgatar'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
