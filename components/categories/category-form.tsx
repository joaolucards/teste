'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Field, FieldLabel } from '@/components/ui/field'
import { CategoryIcon } from '@/components/shared/category-icon'
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '@/lib/constants'
import type { Category, CategoryType } from '@/lib/types'
import { generateId } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface CategoryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (category: Category) => void
  category?: Category
  defaultType?: CategoryType
}

export function CategoryForm({ 
  open, 
  onOpenChange, 
  onSave, 
  category,
  defaultType = 'expense'
}: CategoryFormProps) {
  const [name, setName] = useState(category?.name || '')
  const [type, setType] = useState<CategoryType>(category?.type || defaultType)
  const [icon, setIcon] = useState(category?.icon || 'ellipsis')
  const [color, setColor] = useState(category?.color || AVAILABLE_COLORS[0])

  const isEditing = !!category

  const handleSave = () => {
    if (!name.trim()) return

    const newCategory: Category = {
      id: category?.id || generateId(),
      name: name.trim(),
      type,
      icon,
      color,
      isDefault: category?.isDefault || false,
    }

    onSave(newCategory)
    onOpenChange(false)
    resetForm()
  }

  const resetForm = () => {
    if (!category) {
      setName('')
      setType(defaultType)
      setIcon('ellipsis')
      setColor(AVAILABLE_COLORS[0])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Altere os dados da categoria'
              : 'Crie uma nova categoria para organizar suas transações'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field>
            <FieldLabel>Nome</FieldLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Alimentação, Transporte..."
            />
          </Field>

          {!isEditing && (
            <Field>
              <FieldLabel>Tipo</FieldLabel>
              <Tabs value={type} onValueChange={(v) => setType(v as CategoryType)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="expense">Despesa</TabsTrigger>
                  <TabsTrigger value="income">Receita</TabsTrigger>
                </TabsList>
              </Tabs>
            </Field>
          )}

          <Field>
            <FieldLabel>Ícone</FieldLabel>
            <div className="grid grid-cols-8 gap-2">
              {AVAILABLE_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md border transition-colors",
                    icon === iconName 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <CategoryIcon icon={iconName} color={color} />
                </button>
              ))}
            </div>
          </Field>

          <Field>
            <FieldLabel>Cor</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_COLORS.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  onClick={() => setColor(colorOption)}
                  className={cn(
                    "h-8 w-8 rounded-full transition-transform",
                    color === colorOption && "ring-2 ring-offset-2 ring-primary scale-110"
                  )}
                  style={{ backgroundColor: colorOption }}
                />
              ))}
            </div>
          </Field>

          <div className="flex items-center justify-center gap-2 rounded-lg border bg-muted/50 p-4">
            <div 
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: `${color}20` }}
            >
              <CategoryIcon icon={icon} color={color} size="lg" />
            </div>
            <span className="font-medium">{name || 'Nome da categoria'}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {isEditing ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
