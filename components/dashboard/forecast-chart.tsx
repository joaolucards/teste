'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { ExpandedTransaction } from '@/lib/types'

interface ForecastChartProps {
  forecast: {
    date: string
    balance: number
    transactions: ExpandedTransaction[]
  }[]
}

export function ForecastChart({ forecast }: ForecastChartProps) {
  // Pegar apenas alguns pontos para o gráfico (a cada 3 dias)
  const chartData = forecast
    .filter((_, i) => i % 3 === 0 || i === forecast.length - 1)
    .map(item => ({
      date: formatDateShort(item.date),
      saldo: item.balance,
    }))

  const minBalance = Math.min(...forecast.map(f => f.balance))
  const maxBalance = Math.max(...forecast.map(f => f.balance))
  const hasNegative = minBalance < 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Previsão de Saldo</CardTitle>
        <CardDescription>Projeção para os próximos 30 dias</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={hasNegative ? "#ef4444" : "#22c55e"} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={hasNegative ? "#ef4444" : "#22c55e"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                className="text-muted-foreground"
                domain={[minBalance * 1.1, maxBalance * 1.1]}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-md">
                        <p className="text-sm font-medium">{payload[0].payload.date}</p>
                        <p className="text-sm text-muted-foreground">
                          Saldo: {formatCurrency(payload[0].value as number)}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="saldo"
                stroke={hasNegative ? "#ef4444" : "#22c55e"}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSaldo)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
