'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, type User } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { ensureDefaultCategories } from '@/lib/firestore'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Garante que o novo usuário tenha categorias padrão
        await ensureDefaultCategories(u.uid)
      }
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const signIn = async () => {
    await signInWithPopup(auth, googleProvider)
  }

  const signOut = async () => {
    await fbSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
