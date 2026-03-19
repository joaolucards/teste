'use client'

import { useState, useRef } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { CurrencyInput } from '@/components/shared/currency-input'
import { useSettings } from '@/lib/hooks/use-finance'
import { useAuth } from '@/components/auth/auth-provider'
import { exportData, importData, clearAllData } from '@/lib/firestore'
import { formatCurrency } from '@/lib/utils'
import { Download, Upload, Trash2, Save, AlertTriangle, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function SettingsPage() {
  const { settings, update } = useSettings()
  const { user, signOut } = useAuth()
  const [initialBalance, setInitialBalance] = useState(settings.initialBalance)
  const [hasChanges, setHasChanges] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleBalanceChange = (value: number) => {
    setInitialBalance(value)
    setHasChanges(value !== settings.initialBalance)
  }

  const handleSaveBalance = async () => {
    await update({ initialBalance })
    setHasChanges(false)
    toast.success('Saldo inicial atualizado!')
  }

  const handleExport = async () => {
    if (!user) return
    const data = await exportData(user.uid)
    const blob = new Blob([data], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `financas-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Backup exportado com sucesso!')
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target?.result as string
      const success = await importData(user.uid, content)
      if (success) {
        toast.success('Dados importados com sucesso!')
      } else {
        toast.error('Erro ao importar. Verifique o formato do arquivo.')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const handleClearData = async () => {
    if (!user) return
    await clearAllData(user.uid)
    toast.success('Todos os dados foram removidos.')
  }

  return (
    <>
      <Header title="Configurações" description="Gerencie as configurações do seu app" />
      <main className="flex-1 p-4 md:p-6 space-y-6">

        {/* Conta */}
        <Card>
          <CardHeader>
            <CardTitle>Conta</CardTitle>
            <CardDescription>Você está conectado com sua conta Google</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            {user?.photoURL && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="Foto de perfil" className="h-10 w-10 rounded-full" />
            )}
            <div className="flex-1">
              <p className="font-medium">{user?.displayName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </CardContent>
        </Card>

        {/* Saldo Inicial */}
        <Card>
          <CardHeader>
            <CardTitle>Saldo Inicial</CardTitle>
            <CardDescription>
              Defina o saldo inicial da sua conta para calcular corretamente seu saldo atual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field>
              <FieldLabel>Saldo inicial da conta</FieldLabel>
              <CurrencyInput value={initialBalance} onChange={handleBalanceChange} />
              <p className="mt-1 text-sm text-muted-foreground">
                Valor atual: {formatCurrency(settings.initialBalance)}
              </p>
            </Field>
            {hasChanges && (
              <Button onClick={handleSaveBalance}>
                <Save className="mr-2 h-4 w-4" />
                Salvar alterações
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Backup */}
        <Card>
          <CardHeader>
            <CardTitle>Backup e Restauração</CardTitle>
            <CardDescription>
              Exporte seus dados para um arquivo JSON ou importe de um backup anterior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exportar dados
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Importar dados
              </Button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            </div>
            <p className="text-sm text-muted-foreground">
              Seus dados são salvos automaticamente no Firebase e sincronizados entre dispositivos.
            </p>
          </CardContent>
        </Card>

        {/* Zona de Perigo */}
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
            </div>
            <CardDescription>Ações irreversíveis que afetam todos os seus dados</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Apagar todos os dados
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso removerá permanentemente todas as suas transações, categorias e configurações.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sim, apagar tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Sobre */}
        <Card>
          <CardHeader><CardTitle>Sobre</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Gestão Financeira</strong> — App de controle financeiro pessoal</p>
            <p>Desenvolvido com Next.js, TypeScript, shadcn/ui e Firebase.</p>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
