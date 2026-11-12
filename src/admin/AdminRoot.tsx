import { useEffect, type ReactNode } from 'react'
import { AuthProvider } from './auth'
import './admin.css'

export default function AdminRoot({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Keep the admin portal out of search engines.
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    document.body.classList.add('adm-body')
    return () => {
      meta.remove()
      document.body.classList.remove('adm-body')
    }
  }, [])
  return <AuthProvider>{children}</AuthProvider>
}
