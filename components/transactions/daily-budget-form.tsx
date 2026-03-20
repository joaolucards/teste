'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { CurrencyInput } from '@/components/shared/currency-input'
import { formatDate } from '@/lib/utils'
import type { DailyBudgetOverride } from '@/lib/types'

interface DailyBudgetFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: Date
  existing?: DailyBudgetOverride
  onSave: (override: DailyBudgetOverride) => void
}

export function DailyBudgetForm({
  open,
  onOpenChange,
  date,
  existing,
  onSave,
}: DailyBudgetFormProps) {
  const [amount, setAmount] = useState(existing?.amount ?? 0)
  const [notes, setNotes] = useState(existing?.notes ?? '')

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setAmount(existing?.amount ?? 0)
      setNotes(existing?.notes ?? '')
    }
  }, [open, existing])

  const dateStr = date.toISOString().split('T')[0]

  function handleSave() {
    onSave({ date: dateStr, amount, notes: notes.trim() || undefined })
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
