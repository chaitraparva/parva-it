import { FormEvent, useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from './auth'
import { post, ApiError } from './api'
import BrandMark from '../components/BrandMark'

function AuthShell({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className="adm-auth">
      <div className="adm-auth-card">
        <a className="adm-brand" href="/">
          <span className="brand-emblem"><BrandMark /></span>
          <span>
            <strong>PARVA IT</strong>
            <small>LEAD MANAGEMENT</small>
          </span>
        </a>
        <h1>{title}</h1>
        <p className="adm-muted">{sub}</p>
        {children}
      </div>
    </div>
  )
}

export function LoginPage() {
  const { admin, ready, signIn } = useAuth()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const next = params.get('next')
  const target = next && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin'

  if (ready && admin) return <Navigate to={target} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signIn(email, password)
      nav(target, { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Admin sign in" sub="For the Parva IT team only. Accounts are created by a Super Admin.">
      <form onSubmit={submit} className="adm-form">
        <label>
          Email
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        </label>
        <label>
          <span className="adm-row-between">
            Password
            <button type="button" className="adm-link" onClick={() => setShow((s) => !s)}>
              {show ? 'Hide' : 'Show'}
            </button>
          </span>
          <input
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="adm-alert" role="alert">{error}</p>}
        <button className="adm-btn adm-btn-gold" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <Link className="adm-link" to="/admin/forgot-password">
          Forgot password?
        </Link>
      </form>
    </AuthShell>
  )
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState('')
  const [error, setError] = useState('')
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const r = await post<{ message: string }>('/auth/forgot-password', { email })
      setDone(r.message)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <AuthShell title="Reset your password" sub="Enter your admin email and we will send you a reset link valid for one hour.">
      {done ? (
        <div className="adm-form">
          <p className="adm-success" role="status">{done}</p>
          <Link className="adm-link" to="/admin/login">Back to sign in</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="adm-form">
          <label>
            Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </label>
          {error && <p className="adm-alert" role="alert">{error}</p>}
          <button className="adm-btn adm-btn-gold" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
          <Link className="adm-link" to="/admin/login">Back to sign in</Link>
        </form>
      )}
    </AuthShell>
  )
}

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (pw !== pw2) return setError('The two passwords do not match.')
    setBusy(true)
    setError('')
    try {
      await post('/auth/reset-password', { token, password: pw })
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset the password.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <AuthShell title="Choose a new password" sub="At least 10 characters, with letters and numbers.">
      {done ? (
        <div className="adm-form">
          <p className="adm-success" role="status">Your password has been changed. Please sign in again.</p>
          <Link className="adm-btn adm-btn-gold" to="/admin/login">Go to sign in</Link>
        </div>
      ) : !token ? (
        <div className="adm-form">
          <p className="adm-alert">This reset link is incomplete. Please request a new one.</p>
          <Link className="adm-link" to="/admin/forgot-password">Request a new link</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="adm-form">
          <label>
            New password
            <input type="password" autoComplete="new-password" required minLength={10} value={pw} onChange={(e) => setPw(e.target.value)} />
          </label>
          <label>
            Confirm new password
            <input type="password" autoComplete="new-password" required minLength={10} value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </label>
          {error && <p className="adm-alert" role="alert">{error}</p>}
          <button className="adm-btn adm-btn-gold" disabled={busy}>{busy ? 'Saving…' : 'Set new password'}</button>
        </form>
      )}
    </AuthShell>
  )
}
