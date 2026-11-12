import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, post, type AdminUser } from './api'

interface AuthState {
  admin: AdminUser | null
  ready: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    api<{ admin: AdminUser }>('/auth/me')
      .then((r) => setAdmin(r.admin))
      .catch(() => setAdmin(null))
      .finally(() => setReady(true))
    const onSignedOut = () => setAdmin(null)
    window.addEventListener('parva-admin:signed-out', onSignedOut)
    return () => window.removeEventListener('parva-admin:signed-out', onSignedOut)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const r = await post<{ admin: AdminUser }>('/auth/login', { email, password })
    setAdmin(r.admin)
  }, [])

  const signOut = useCallback(async () => {
    await post('/auth/logout', {}).catch(() => undefined)
    setAdmin(null)
  }, [])

  return <AuthContext.Provider value={{ admin, ready, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
