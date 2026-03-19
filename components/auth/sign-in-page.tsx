'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/context/auth-context'
import { Button } from '@/components/ui/button'
import { Wallet, ShieldCheck, RefreshCw } from 'lucide-react'

export function SignInPage() {
  const { signInWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
    } catch {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-8 text-center">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Gestão Financeira</h1>
            <p className="mt-1 text-muted-foreground">Controle suas finanças de qualquer dispositivo</p>
          </div>
        </div>

        {/* Benefícios */}
        <div className="space-y-3 rounded-xl border bg-card p-5 text-left">
          <div className="flex items-start gap-3">
            <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Sincronização automática</p>
              <p className="text-xs text-muted-foreground">Seus dados ficam salvos na nuvem e acessíveis em qualquer dispositivo</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Dados privados e seguros</p>
              <p className="text-xs text-muted-foreground">Apenas você acessa suas informações financeiras</p>
            </div>
          </div>
        </div>

        {/* Botão de login */}
        <Button
          size="lg"
          className="w-full gap-3"
          onClick={handleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          {isLoading ? 'Entrando…' : 'Entrar com Google'}
        </Button>

        <p className="text-xs text-muted-foreground">
          Ao entrar, você concorda que seus dados financeiros serão armazenados de forma segura no Firebase (Google).
        </p>
      </div>
    </div>
  )
}
