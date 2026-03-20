'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { CategoryIcon } from '@/components/shared/category-icon'
import { CurrencyInput } from '@/components/shared/currency-input'
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '@/lib/constants'
import { generateId } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Vault } from '@/lib/types'

interface VaultFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (vault: Vault) => void
  vault?: Vault
}

export function VaultForm({ open, onOpenChange, onSave, vault }: VaultFormProps) {
  const [name, setName] = useState(vault?.name || '')
  const [icon, setIcon] = useState(vault?.icon || 'piggy-bank')
  const [color, setColor] = useState(vault?.color || AVAILABLE_COLORS[0])
  const [goal, setGoal] = useState(vault?.goal ?? 0)

  useEffect(() => {
    if (open) {
      setName(vault?.name || '')
      setIcon(vault?.icon || 'piggy-bank')
      setColor(vault?.color || AVAILABLE_COLORS[0])
      setGoal(vault?.goal ?? 0)
    }
  }, [open, vault])

  function handleSave() {
    if (!name.trim()) return
    onSave({
      id: vault?.id || generateId(),
      name: name.trim(),
      icon,
      color,
      goal: goal > 0 ? goal : undefined,
      createdAt: vault?.createdAt || new Date().toISOString(),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{vault ? 'Editar Cofrinho' : 'Novo Cofrinho'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Field>
            <FieldLabel>Nome</FieldLabel>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Viagem, Reserva, Carro..."
            />
          </Field>

          <Field>
            <FieldLabel>Meta (opcional)</FieldLabel>
            <CurrencyInput value={goal} onChange={setGoal} />
          </Field>

          <Field>
            <FieldLabel>Ícone</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_ICONS.map(ic => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
                    icon === ic ? 'border-primary bg-primary/10' : 'hover:bg-muted'
                  )}
                >
                  <CategoryIcon icon={ic} color={icon === ic ? color : undefined} size="md" />
                </button>
              ))}
            </div>
          </Field>

          <Field>
            <FieldLabel>Cor</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_COLORS.map(colorVal => (
                <button
                  key={colorVal}
                  onClick={() => setColor(colorVal)}
                  className={cn(
                    'h-7 w-7 rounded-full border-2 transition-transform',
                    color === colorVal ? 'border-foreground scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: colorVal }}
                />
              ))}
            </div>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
