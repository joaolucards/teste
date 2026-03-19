'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CategoryForm } from '@/components/categories/category-form'
import { CategoryIcon } from '@/components/shared/category-icon'
import { useCategories } from '@/lib/hooks/use-finance'
import { Plus, Pencil, Trash2, Lock } from 'lucide-react'
import type { Category, CategoryType } from '@/lib/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

export default function CategoriesPage() {
  const { categories, incomeCategories, expenseCategories, add, update, remove } = useCategories()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | undefined>()
  const [deleteCategory, setDeleteCategory] = useState<Category | undefined>()
  const [defaultType, setDefaultType] = useState<CategoryType>('expense')

  const handleSave = (category: Category) => {
    if (editingCategory) {
      update(category.id, category)
    } else {
      add(category)
    }
    setEditingCategory(undefined)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsFormOpen(true)
  }

  const handleDelete = () => {
    if (deleteCategory) {
      remove(deleteCategory.id)
      setDeleteCategory(undefined)
    }
  }

  const handleNewCategory = (type: CategoryType) => {
    setDefaultType(type)
    setEditingCategory(undefined)
    setIsFormOpen(true)
  }

  const renderCategoryList = (categoryList: Category[], type: CategoryType) => (
    <div className="space-y-2">
      {categoryList.map((category) => (
        <div
          key={category.id}
          className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <CategoryIcon icon={category.icon} color={category.color} size="lg" />
            </div>
            <div>
              <p className="font-medium">{category.name}</p>
              <p className="text-xs text-muted-foreground">
                {category.isDefault ? 'Categoria padrão' : 'Categoria personalizada'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {category.isDefault ? (
              <Lock className="h-4 w-4 text-muted-foreground" />
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(category)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteCategory(category)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        className="w-full"
        onClick={() => handleNewCategory(type)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Adicionar {type === 'expense' ? 'Despesa' : 'Receita'}
      </Button>
    </div>
  )

  return (
    <>
      <Header 
        title="Categorias" 
        description="Gerencie suas categorias de receitas e despesas"
      />
      <main className="flex-1 p-4 md:p-6">
        <Tabs defaultValue="expense" className="space-y-4">
          <TabsList>
            <TabsTrigger value="expense">
              Despesas ({expenseCategories.length})
            </TabsTrigger>
            <TabsTrigger value="income">
              Receitas ({incomeCategories.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expense">
            <Card>
              <CardHeader>
                <CardTitle>Categorias de Despesas</CardTitle>
                <CardDescription>
                  Organize seus gastos em categorias para melhor controle
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderCategoryList(expenseCategories, 'expense')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="income">
            <Card>
              <CardHeader>
                <CardTitle>Categorias de Receitas</CardTitle>
                <CardDescription>
                  Organize suas fontes de renda em categorias
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderCategoryList(incomeCategories, 'income')}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <CategoryForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
        category={editingCategory}
        defaultType={defaultType}
      />

      <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{deleteCategory?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
