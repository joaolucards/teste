'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { CurrencyInput } from '@/components/shared/currency-input'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { DailyBudgetOverride } from '@/lib/types'

type SaveScope = 'this-only' | 'from-date'

interface DailyBudgetFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: Date
  existing?: DailyBudgetOverride
  existingDefault?: { amount: number; notes?: string; from?: string }
  onSave: (override: DailyBudgetOverride) => void
  onSaveDefault: (amount: number, from: string, notes?: string) => void
}

const scopeOptions: { value: SaveScope; label: string; description: string }[] = [
  {
    value: 'this-only',
    label: 'Somente hoje',
    description: 'Aplica o valor apenas neste dia. Os demais dias permanecem como estão.',
  },
  {
    value: 'from-date',
    label: 'Este dia em diante',
    description: 'Define este valor como padrão a partir de hoje. Dias anteriores não são alterados.',
  },
]

export function DailyBudgetForm({
  open,
  onOpenChange,
  date,
  existing,
  existingDefault,
  onSave,
  onSaveDefault,
}: DailyBudgetFormProps) {
  const [amount, setAmount] = useState(0)
  const [notes, setNotes] = useState('')
  const [scope, setScope] = useState<SaveScope>('this-only')

  useEffect(() => {
    if (open) {
      // Pre-fill: specific override > default > 0
      setAmount(existing?.amount ?? existingDefault?.amount ?? 0)
      setNotes(existing?.notes ?? existingDefault?.notes ?? '')
      setScope('this-only')
    }
  }, [open, existing, existingDefault])

  const dateStr = date.toISOString().split('T')[0]

  function handleSave() {
    if (scope === 'this-only') {
      onSave({ date: dateStr, amount, notes: notes.trim() || undefined })
    } else {
      onSaveDefault(amount, dateStr, notes.trim() || undefined)
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto px-6">
        <SheetHeader>
          <SheetTitle>Gasto Diário</SheetTitle>
          <SheetDescription>
            {formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <Field>
            <FieldLabel>Valor gasto no dia</FieldLabel>
            <CurrencyInput value={amount} onChange={setAmount} />
          </Field>

          <Field>
            <FieldLabel>
              Notas{' '}
              <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
            </FieldLabel>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="O que você fez hoje? Onde gastou?"
              className="resize-none"
              rows={3}
            />
          </Field>

          {/* Scope selector */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Aplicar a</p>
            {scopeOptions.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                  scope === opt.value
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                )}
              >
                <input
                  type="radio"
                  name="daily-scope"
                  value={opt.value}
                  checked={scope === opt.value}
                  onChange={() => setScope(opt.value)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
