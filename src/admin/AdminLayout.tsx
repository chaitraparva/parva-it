import { useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from './auth'
import { ROLES } from '../lib/options'
import BrandMark from '../components/BrandMark'

export default function AdminLayout() {
  const { admin, ready, signOut } = useAuth()
  const loc = useLocation()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [loc.pathname])
  useEffect(() => {
    document.title = 'Parva IT Admin'
  }, [])

  if (!ready) return <div className="adm-loading">Loading…</div>
  if (!admin) return <Navigate to={`/admin/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />

  const links: [string, string, boolean][] = [
    ['/admin', 'Dashboard', true],
    ['/admin/leads', 'Leads', true],
    ['/admin/team', 'Team', true],
    ['/admin/settings', 'Settings', true],
  ]

  return (
    <div className="adm-shell">
      <aside className={`adm-sidebar ${open ? 'open' : ''}`}>
        <a className="adm-brand" href="/">
          <span className="brand-emblem"><BrandMark /></span>
          <span>
            <strong>PARVA IT</strong>
            <small>LEAD MANAGEMENT</small>
          </span>
        </a>
        <nav aria-label="Admin">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/admin'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="adm-me">
          <strong>{admin.name}</strong>
          <small>{ROLES[admin.role]}</small>
          <button
            className="adm-btn adm-btn-ghost"
            onClick={async () => {
              await signOut()
              nav('/admin/login', { replace: true })
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      {open && <div className="adm-scrim" onClick={() => setOpen(false)} />}
      <div className="adm-main">
        <header className="adm-topbar">
          <button className="adm-menu" onClick={() => setOpen(true)} aria-label="Open menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 8h16M4 16h16" /></svg>
          </button>
          <span className="adm-muted">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <a className="adm-link" href="/" target="_blank" rel="noopener">View website ↗</a>
        </header>
        <div className="adm-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
