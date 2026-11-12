import { FormEvent, useCallback, useEffect, useState } from 'react'
import { api, patch, post, put, fmtDateTime, type TeamMember } from './api'
import { useAuth } from './auth'
import { PageHead, ErrorNote, Empty } from './ui'
import { ROLES, type Role } from '../lib/options'

export function Team() {
  const { admin } = useAuth()
  const isSuper = admin?.role === 'super_admin'
  const [team, setTeam] = useState<TeamMember[] | null>(null)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState({ name: '', email: '', role: 'executive' as Role, password: '' })
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    api<{ team: TeamMember[] }>('/admin/team').then((r) => setTeam(r.team)).catch((e) => setError(e.message))
  }, [])
  useEffect(load, [load])

  const add = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await post('/admin/team', f)
      setF({ name: '', email: '', role: 'executive', password: '' })
      setAdding(false)
      load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const change = async (id: string, body: Record<string, unknown>) => {
    setError('')
    try {
      await patch(`/admin/team/${id}`, body)
      load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <>
      <PageHead
        title="Team"
        sub={isSuper ? 'Admin accounts. There is no public sign-up: only a Super Admin can add people.' : 'People leads can be assigned to.'}
        actions={isSuper && <button className="adm-btn adm-btn-gold" onClick={() => setAdding((a) => !a)}>{adding ? 'Close' : 'Add team member'}</button>}
      />
      {error && <ErrorNote error={error} />}
      {adding && (
        <form className="adm-card" onSubmit={add}>
          <h2>New team member</h2>
          <div className="adm-form-grid">
            <label>Full name<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <label>Email<input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
            <label>Role
              <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}>
                {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label>Temporary password<input required type="text" minLength={10} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder="Min 10 characters, letters and numbers" /></label>
          </div>
          <p className="adm-muted">Share the password privately. They can change it under Settings after signing in.</p>
          <div className="adm-modal-actions"><button className="adm-btn adm-btn-gold" disabled={busy}>{busy ? 'Adding…' : 'Add team member'}</button></div>
        </form>
      )}
      <div className="adm-card">
        <h2>Roles</h2>
        <ul className="adm-roles">
          <li><b>Super Admin</b> Everything, including team, settings, lead deletion and export.</li>
          <li><b>Sales Manager</b> All leads, assignment to anyone, CSV export, view settings.</li>
          <li><b>Sales Executive</b> All leads, can assign leads to themselves, notes and status updates. No export.</li>
        </ul>
      </div>
      {!team ? (
        <div className="adm-loading">Loading…</div>
      ) : team.length === 0 ? (
        <Empty>No team members.</Empty>
      ) : (
        <div className="adm-card flush">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Name</th><th>Role</th>{isSuper && <><th>Email</th><th className="num">Open leads</th><th>Last sign-in</th><th>Status</th></>}</tr></thead>
              <tbody>
                {team.map((m) => (
                  <tr key={m.id} className={m.active === false ? 'inactive' : ''}>
                    <td><strong>{m.name}</strong>{m.id === admin?.id && <small>You</small>}</td>
                    <td>
                      {isSuper && m.id !== admin?.id ? (
                        <select value={m.role} onChange={(e) => change(m.id, { role: e.target.value })} aria-label={`Role for ${m.name}`}>
                          {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      ) : ROLES[m.role]}
                    </td>
                    {isSuper && (
                      <>
                        <td>{m.email}</td>
                        <td className="num">{m.open_leads}</td>
                        <td>{m.last_login_at ? fmtDateTime(m.last_login_at) : <span className="adm-muted">Never</span>}</td>
                        <td>
                          {m.id === admin?.id ? 'Active' : (
                            <button className="adm-link" onClick={() => change(m.id, { active: !m.active })}>
                              {m.active ? 'Active · Deactivate' : 'Inactive · Reactivate'}
                            </button>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

export function Settings() {
  const { admin } = useAuth()
  const isSuper = admin?.role === 'super_admin'
  const canView = isSuper || admin?.role === 'manager'
  const [cfg, setCfg] = useState<{ notifications: { enabled: boolean; recipients: string[] }; mailConfigured: boolean; mailFrom: string | null } | null>(null)
  const [recipients, setRecipients] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState('')
  const [pwErr, setPwErr] = useState('')

  useEffect(() => {
    if (!canView) return
    api<NonNullable<typeof cfg>>('/admin/settings')
      .then((r) => {
        setCfg(r)
        setEnabled(r.notifications.enabled)
        setRecipients(r.notifications.recipients.join(', '))
      })
      .catch((e) => setError(e.message))
  }, [canView])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setMsg('')
    setError('')
    try {
      const list = recipients.split(/[,\s;]+/).map((s) => s.trim()).filter(Boolean)
      const r = await put<{ notifications: { enabled: boolean; recipients: string[] } }>('/admin/settings', { notifications: { enabled, recipients: list } })
      setRecipients(r.notifications.recipients.join(', '))
      setMsg('Notification settings saved.')
    } catch (err) {
      setError((err as Error).message)
    }
  }
  const test = async () => {
    setMsg('')
    setError('')
    try {
      const r = await post<{ sentTo: string }>('/admin/settings/test-email', {})
      setMsg(`Test email sent to ${r.sentTo}.`)
    } catch (err) {
      setError((err as Error).message)
    }
  }
  const changePw = async (e: FormEvent) => {
    e.preventDefault()
    setPwMsg('')
    setPwErr('')
    if (pw.newPassword !== pw.confirm) return setPwErr('The new passwords do not match.')
    try {
      await post('/auth/change-password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword })
      setPw({ currentPassword: '', newPassword: '', confirm: '' })
      setPwMsg('Password changed.')
    } catch (err) {
      setPwErr((err as Error).message)
    }
  }

  return (
    <>
      <PageHead title="Settings" />
      {canView && (
        <form className="adm-card" onSubmit={save}>
          <h2>New inquiry email notifications</h2>
          <p className="adm-muted">
            When switched on, every new website inquiry is emailed to the addresses below from the official Parva IT mailbox
            {cfg?.mailFrom ? <> (<b>{cfg.mailFrom}</b>)</> : ''}.
          </p>
          {cfg && !cfg.mailConfigured && (
            <p className="adm-alert">
              Email sending is not configured on the server yet. Add the SMTP settings for the Parva IT business mailbox
              (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM) to the environment variables, then redeploy.
            </p>
          )}
          {error && <ErrorNote error={error} />}
          {msg && <p className="adm-success" role="status">{msg}</p>}
          <label className="adm-check">
            <input type="checkbox" checked={enabled} disabled={!isSuper} onChange={(e) => setEnabled(e.target.checked)} />
            Send an email for every new inquiry
          </label>
          <label className="adm-field">
            Recipients (comma-separated)
            <input value={recipients} disabled={!isSuper} onChange={(e) => setRecipients(e.target.value)} placeholder="sales@yourdomain.com, manager@yourdomain.com" />
          </label>
          {isSuper ? (
            <div className="adm-modal-actions">
              <button type="button" className="adm-btn adm-btn-ghost" onClick={test} disabled={!cfg?.mailConfigured}>Send test email to me</button>
              <button className="adm-btn adm-btn-gold">Save</button>
            </div>
          ) : (
            <p className="adm-muted">Only a Super Admin can change these settings.</p>
          )}
        </form>
      )}
      <form className="adm-card adm-narrow" onSubmit={changePw}>
        <h2>Change my password</h2>
        <label className="adm-field">Current password<input type="password" autoComplete="current-password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></label>
        <label className="adm-field">New password<input type="password" autoComplete="new-password" required minLength={10} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></label>
        <label className="adm-field">Confirm new password<input type="password" autoComplete="new-password" required minLength={10} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></label>
        {pwErr && <p className="adm-alert" role="alert">{pwErr}</p>}
        {pwMsg && <p className="adm-success" role="status">{pwMsg}</p>}
        <div className="adm-modal-actions"><button className="adm-btn adm-btn-gold">Change password</button></div>
      </form>
    </>
  )
}
