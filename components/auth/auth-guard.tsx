'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/context/auth-context'
import { SignInPage } from './sign-in-page'
import * as storage from '@/lib/storage'
import { Skeleton } from '@/components/ui/skeleton'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  // Inicializa categorias e configurações padrão na primeira entrada
  useEffect(() => {
    if (user) {
      storage.initializeUserData(user.uid)
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-3 w-64">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <SignInPage />
  }

  return <>{children}</>
}
