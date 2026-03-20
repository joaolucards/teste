'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { VaultForm } from '@/components/vaults/vault-form'
import { VaultTransactionForm } from '@/components/vaults/vault-transaction-form'
import { CategoryIcon } from '@/components/shared/category-icon'
import { useVaults } from '@/lib/hooks/use-finance'
import { formatCurrency, formatDate, parseISODate } from '@/lib/utils'
import { Plus, Pencil, Trash2, ArrowDownLeft, ArrowUpRight, History } from 'lucide-react'
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [editingVault, setEditingVault] = useState<Vault | undefined>()
  const [deletingVault, setDeletingVault] = useState<Vault | undefined>()
  const [deletingTx, setDeletingTx] = useState<{ vaultId: string; tx: VaultTransaction } | undefined>()
  const [historyVault, setHistoryVault] = useState<Vault | undefined>()
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

  function handleOpenHistory(vault: Vault) {
    setHistoryVault(vault)
    setIsHistoryOpen(true)
  }

  function handleConfirmDeleteTx() {
    if (!deletingTx) return
    removeVaultTransaction(deletingTx.vaultId, deletingTx.tx.id)
    setDeletingTx(undefined)
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

  // History sheet transactions sorted newest first
  const historyTxs = historyVault
    ? [...(vaultTransactions[historyVault.id] ?? [])]
        .sort((a, b) => b.date.localeCompare(a.date))
    : []

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
                .sort((a, b) => b.date.localeCompare(a.date))
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
                          onClick={() => handleOpenHistory(vault)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Ver histórico"
                        >
                          <History className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => { setEditingVault(vault); setIsVaultFormOpen(true) }}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Editar cofrinho"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingVault(vault)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Excluir cofrinho"
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

                    {/* Recent transactions — 3 most recent, no delete here */}
                    {recentTxs.length > 0 && (
                      <div className="space-y-1.5 border-t pt-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Últimas movimentações
                          </p>
                          {txs.length > 3 && (
                            <button
                              onClick={() => handleOpenHistory(vault)}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Ver todas ({txs.length})
                            </button>
                          )}
                        </div>
                        {recentTxs.map(tx => (
                          <div key={tx.id} className="group flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {tx.type === 'deposit'
                                ? <ArrowDownLeft className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                                : <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                              <span className="truncate text-xs">{tx.title}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-2">
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
                                title="Editar"
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

      {/* History sheet */}
      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent className="overflow-y-auto px-6 w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{historyVault?.name} — Histórico</SheetTitle>
            <SheetDescription>
              Saldo atual:{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {historyVault ? formatCurrency(balances[historyVault.id] ?? 0) : '—'}
              </span>
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-2">
            {historyTxs.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Nenhuma movimentação registrada
              </p>
            ) : (
              historyTxs.map(tx => (
                <div
                  key={tx.id}
                  className="group flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      tx.type === 'deposit'
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                    )}>
                      {tx.type === 'deposit'
                        ? <ArrowDownLeft className="h-4 w-4" />
                        : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <span className={cn(
                      'text-sm font-semibold',
                      tx.type === 'deposit'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-amber-600 dark:text-amber-400'
                    )}>
                      {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                    <button
                      onClick={() => { handleEditTx(tx) }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => historyVault && setDeletingTx({ vaultId: historyVault.id, tx })}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

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

      {/* Delete vault */}
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

      {/* Delete vault transaction */}
      <AlertDialog open={!!deletingTx} onOpenChange={o => { if (!o) setDeletingTx(undefined) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir movimentação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deletingTx?.tx.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDeleteTx}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
