'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { Category } from '@/lib/types'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface CategoryBreakdownProps {
  breakdown: Record<string, number>
  categories: Category[]
  type: 'income' | 'expense'
}

export function CategoryBreakdown({ breakdown, categories, type }: CategoryBreakdownProps) {
  const data = Object.entries(breakdown)
    .map(([categoryId, amount]) => {
      const category = categories.find(c => c.id === categoryId)
      return {
        name: category?.name || 'Outros',
        value: amount,
        color: category?.color || '#6b7280',
      }
    })
    .sort((a, b) => b.value - a.value)

  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{type === 'expense' ? 'Despesas por Categoria' : 'Receitas por Categoria'}</CardTitle>
          <CardDescription>Distribuição do mês atual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[250px] items-center justify-center text-muted-foreground">
            Nenhuma {type === 'expense' ? 'despesa' : 'receita'} registrada este mês
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{type === 'expense' ? 'Despesas por Categoria' : 'Receitas por Categoria'}</CardTitle>
        <CardDescription>
          Total: {formatCurrency(total)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload
                    const percentage = ((item.value / total) * 100).toFixed(1)
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-md">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.value)} ({percentage}%)
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend
                formatter={(value) => <span className="text-sm">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
