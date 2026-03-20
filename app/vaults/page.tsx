'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { VaultForm } from '@/components/vaults/vault-form'
import { VaultTransactionForm } from '@/components/vaults/vault-transaction-form'
import { CategoryIcon } from '@/components/shared/category-icon'
import { useVaults } from '@/lib/hooks/use-finance'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Pencil, Trash2, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import type { Vault, VaultTransaction } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'

export default function VaultsPage() {
  const {
    vaults, vaultTransactions, isLoading,
    addVault, updateVault, removeVault,
    addVaultTransaction, updateVaultTransaction, removeVaultTransaction, getVaultBalances,
  } = useVaults()

  const [isVaultFormOpen, setIsVaultFormOpen] = useState(false)
  const [isTxFormOpen, setIsTxFormOpen] = useState(false)
  const [editingVault, setEditingVault] = useState<Vault | undefined>()
  const [deletingVault, setDeletingVault] = useState<Vault | undefined>()
  const [selectedVaultId, setSelectedVaultId] = useState<string | undefined>()
  const [defaultTxType, setDefaultTxType] = useState<'deposit' | 'withdrawal'>('deposit')
  const [editingVaultTx, setEditingVaultTx] = useState<VaultTransaction | undefined>()

  const balances = getVaultBalances()
  const totalVaulted = Object.values(balances).reduce((s, b) => s + Math.max(0, b), 0)

  function handleEditTx(tx: VaultTransaction) {
    setEditingVaultTx(tx)
    setIsTxFormOpen(true)
  }

  function handleOpenTx(vaultId: string, type: 'deposit' | 'withdrawal') {
    setEditingVaultTx(undefined)
    setSelectedVaultId(vaultId)
    setDefaultTxType(type)
    setIsTxFormOpen(true)
  }

  if (isLoading) {
    return (
      <>
        <Header title="Cofrinhos" description="Gerencie suas reservas e metas" />
        <main className="flex-1 space-y-6 p-4 md:p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Header
        title="Cofrinhos"
        description="Gerencie suas reservas e metas"
        actions={
          <Button size="sm" onClick={() => { setEditingVault(undefined); setIsVaultFormOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cofrinho
          </Button>
        }
      />

      <main className="flex-1 space-y-6 p-4 md:p-6">
        {/* Total summary */}
        {vaults.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total guardado</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(totalVaulted)}
                  </p>
                </div>
                <Button onClick={() => { setSelectedVaultId(undefined); setDefaultTxType('deposit'); setIsTxFormOpen(true) }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Movimentar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vault cards */}
        {vaults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <p className="text-lg">Nenhum cofrinho criado</p>
            <Button onClick={() => setIsVaultFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar primeiro cofrinho
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vaults.map(vault => {
              const balance = balances[vault.id] ?? 0
              const progress = vault.goal ? Math.min(100, (balance / vault.goal) * 100) : null
              const txs = vaultTransactions[vault.id] ?? []
              const recentTxs = [...txs]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 3)

              return (
                <Card key={vault.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${vault.color}20` }}
                        >
                          <CategoryIcon icon={vault.icon} color={vault.color} size="lg" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{vault.name}</CardTitle>
                          {vault.goal && (
                            <p className="text-xs text-muted-foreground">
                              Meta: {formatCurrency(vault.goal)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingVault(vault); setIsVaultFormOpen(true) }}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingVault(vault)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-4">
                    {/* Balance */}
                    <div>
                      <p className={cn(
                        'text-2xl font-bold',
                        balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                      )}>
                        {formatCurrency(balance)}
                      </p>
                      {progress !== null && (
                        <div className="mt-2 space-y-1">
                          <Progress value={progress} className="h-2" />
                          <p className="text-xs text-muted-foreground text-right">{progress.toFixed(0)}% da meta</p>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/30"
                        onClick={() => handleOpenTx(vault.id, 'deposit')}
                      >
                        <ArrowDownLeft className="mr-1 h-3.5 w-3.5" />
                        Guardar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-300 dark:hover:bg-amber-950/30"
                        onClick={() => handleOpenTx(vault.id, 'withdrawal')}
                      >
                        <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
                        Resgatar
                      </Button>
                    </div>

                    {/* Recent transactions */}
                    {recentTxs.length > 0 && (
                      <div className="space-y-1.5 border-t pt-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Últimas movimentações
                        </p>
                        {recentTxs.map(tx => (
                          <div key={tx.id} className="group flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {tx.type === 'deposit'
                                ? <ArrowDownLeft className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                                : <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                              <span className="truncate text-xs">{tx.title}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <div className="text-right">
                                <span className={cn(
                                  'text-xs font-medium',
                                  tx.type === 'deposit'
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                )}>
                                  {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                                </span>
                                <p className="text-[10px] text-muted-foreground">{formatDate(tx.date)}</p>
                              </div>
                              <button
                                onClick={() => handleEditTx(tx)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      <VaultForm
        open={isVaultFormOpen}
        onOpenChange={setIsVaultFormOpen}
        vault={editingVault}
        onSave={v => editingVault ? updateVault(v.id, v) : addVault(v)}
      />

      <VaultTransactionForm
        open={isTxFormOpen}
        onOpenChange={(v) => { if (!v) setEditingVaultTx(undefined); setIsTxFormOpen(v) }}
        vaults={vaults}
        defaultVaultId={selectedVaultId}
        defaultType={defaultTxType}
        editingTransaction={editingVaultTx}
        onSave={(tx) => {
          if (editingVaultTx) {
            updateVaultTransaction(tx.vaultId, tx.id, tx)
          } else {
            addVaultTransaction(tx)
          }
          setEditingVaultTx(undefined)
        }}
      />

      <AlertDialog open={!!deletingVault} onOpenChange={o => { if (!o) setDeletingVault(undefined) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cofrinho</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá excluir "{deletingVault?.name}" e todo o seu histórico permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deletingVault) { removeVault(deletingVault.id); setDeletingVault(undefined) } }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
