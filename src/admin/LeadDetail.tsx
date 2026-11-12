import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { api, patch, post, fmtDate, fmtDateTime, type LeadDetailResponse } from './api'
import { useAuth } from './auth'
import { useTeam } from './Leads'
import { PageHead, StatusBadge, ErrorNote, Empty } from './ui'
import { LEAD_STATUSES, REQUIREMENTS, PROJECT_INTERESTS, LEAD_SOURCES, INDUSTRIES, BUDGETS } from '../lib/options'

type Form = {
  fullName: string; company: string; email: string; phone: string; industry: string; service: string
  projectInterest: string; description: string; budget: string; source: string
}

export default function LeadDetail() {
  const { id = '' } = useParams()
  const { admin } = useAuth()
  const nav = useNavigate()
  const team = useTeam()
  const [data, setData] = useState<LeadDetailResponse | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState('')
  const [saved, setSaved] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Form | null>(null)
  const [note, setNote] = useState('')

  const load = useCallback(() => {
    setError('')
    api<LeadDetailResponse>(`/admin/leads/${id}`).then(setData).catch((e) => setError(e.message))
  }, [id])
  useEffect(load, [load])

  const update = async (body: Record<string, unknown>, label: string) => {
    setSaving(label)
    setSaved('')
    setError('')
    try {
      const r = await patch<LeadDetailResponse>(`/admin/leads/${id}`, body)
      setData(r)
      setSaved(`${label} saved`)
      setTimeout(() => setSaved(''), 2500)
      return true
    } catch (e) {
      setError((e as Error).message)
      return false
    } finally {
      setSaving('')
    }
  }

  if (error && !data) return <ErrorNote error={error} onRetry={load} />
  if (!data) return <div className="adm-loading">Loading lead…</div>
  const l = data.lead

  const startEdit = () => {
    setForm({
      fullName: l.full_name, company: l.company || '', email: l.email, phone: l.phone, industry: l.industry || '',
      service: l.service, projectInterest: l.project_interest || '', description: l.description, budget: l.budget || '', source: l.source,
    })
    setEditing(true)
  }
  const saveEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (form && (await update(form, 'Lead details'))) setEditing(false)
  }
  const addNote = async (e: FormEvent) => {
    e.preventDefault()
    if (!note.trim()) return
    setSaving('Note')
    try {
      setData(await post<LeadDetailResponse>(`/admin/leads/${id}/notes`, { note }))
      setNote('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving('')
    }
  }
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((f) => (f ? { ...f, [k]: e.target.value } : f))
  const assignable = admin?.role === 'executive' ? team.filter((m) => m.id === admin.id) : team

  return (
    <>
      <Link className="adm-link adm-back" to="/admin/leads">← All leads</Link>
      <PageHead
        title={l.full_name}
        sub={<>{l.lead_code} · {l.company || 'No company'} · received {fmtDateTime(l.created_at)}</>}
        actions={<StatusBadge status={l.status} />}
      />
      {error && <ErrorNote error={error} />}
      {saved && <p className="adm-success" role="status">{saved}</p>}

      <div className="adm-detail">
        <div className="adm-detail-main">
          <section className="adm-card">
            <div className="adm-card-head">
              <h2>Lead information</h2>
              {!editing && <button className="adm-btn adm-btn-ghost" onClick={startEdit}>Edit</button>}
            </div>
            {editing && form ? (
              <form onSubmit={saveEdit}>
                <div className="adm-form-grid">
                  <label>Customer name<input required value={form.fullName} onChange={set('fullName')} /></label>
                  <label>Company<input value={form.company} onChange={set('company')} /></label>
                  <label>Email<input required type="email" value={form.email} onChange={set('email')} /></label>
                  <label>Phone<input required value={form.phone} onChange={set('phone')} /></label>
                  <label>Industry<select value={form.industry} onChange={set('industry')}><option value="">—</option>{INDUSTRIES.map((o) => <option key={o}>{o}</option>)}</select></label>
                  <label>Interested service<select value={form.service} onChange={set('service')}>{REQUIREMENTS.map((o) => <option key={o}>{o}</option>)}</select></label>
                  <label>Project interest<select value={form.projectInterest} onChange={set('projectInterest')}><option value="">—</option>{PROJECT_INTERESTS.map((o) => <option key={o}>{o}</option>)}</select></label>
                  <label>Lead source<select value={form.source} onChange={set('source')}>{[...new Set([form.source, ...LEAD_SOURCES])].map((o) => <option key={o}>{o}</option>)}</select></label>
                  <label>Budget<select value={form.budget} onChange={set('budget')}><option value="">—</option>{BUDGETS.map((o) => <option key={o}>{o}</option>)}</select></label>
                  <label className="span-2">Project description<textarea rows={5} required value={form.description} onChange={set('description')} /></label>
                </div>
                <div className="adm-modal-actions">
                  <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                  <button className="adm-btn adm-btn-gold" disabled={!!saving}>{saving ? 'Saving…' : 'Save changes'}</button>
                </div>
              </form>
            ) : (
              <dl className="adm-dl">
                <div><dt>Lead ID</dt><dd>{l.lead_code}</dd></div>
                <div><dt>Email</dt><dd><a href={`mailto:${l.email}`}>{l.email}</a></dd></div>
                <div><dt>Phone</dt><dd><a href={`tel:${l.phone.replace(/[^+\d]/g, '')}`}>{l.phone}</a></dd></div>
                <div><dt>Company</dt><dd>{l.company || '—'}</dd></div>
                <div><dt>Industry</dt><dd>{l.industry || '—'}</dd></div>
                <div><dt>Interested service</dt><dd>{l.service}</dd></div>
                <div><dt>Project interest</dt><dd>{l.project_interest || '—'}</dd></div>
                <div><dt>Budget</dt><dd>{l.budget || '—'}</dd></div>
                <div><dt>Lead source</dt><dd>{l.source}</dd></div>
                <div><dt>Inquiry date</dt><dd>{fmtDateTime(l.created_at)}</dd></div>
                <div className="span-2"><dt>Project description</dt><dd className="pre">{l.description}</dd></div>
              </dl>
            )}
          </section>

          <section className="adm-card">
            <div className="adm-card-head"><h2>Internal notes</h2></div>
            <form onSubmit={addNote} className="adm-note-form">
              <textarea rows={3} placeholder="Add a note for the team (calls, meetings, requirements)…" value={note} onChange={(e) => setNote(e.target.value)} maxLength={4000} />
              <button className="adm-btn adm-btn-gold" disabled={!note.trim() || saving === 'Note'}>{saving === 'Note' ? 'Adding…' : 'Add note'}</button>
            </form>
            {data.notes.length === 0 ? (
              <Empty>No notes yet.</Empty>
            ) : (
              <ul className="adm-notes">
                {data.notes.map((n) => (
                  <li key={n.id}>
                    <p className="pre">{n.note}</p>
                    <small>{n.admin_name || 'Former team member'} · {fmtDateTime(n.created_at)}</small>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="adm-detail-side">
          <section className="adm-card">
            <h2>Pipeline</h2>
            <label className="adm-field">
              Lead status
              <select value={l.status} disabled={!!saving} onChange={(e) => update({ status: e.target.value }, 'Status')}>
                {LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="adm-field">
              Assigned person
              <select value={l.assigned_to || ''} disabled={!!saving} onChange={(e) => update({ assignedTo: e.target.value || null }, 'Assignment')}>
                <option value="">Unassigned</option>
                {l.assigned_to && !assignable.some((m) => m.id === l.assigned_to) && <option value={l.assigned_to}>{l.assigned_name}</option>}
                {assignable.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>
            <label className="adm-field">
              Follow-up date
              <input type="date" value={l.follow_up_date || ''} disabled={!!saving} onChange={(e) => update({ followUpDate: e.target.value }, 'Follow-up date')} />
            </label>
            {l.follow_up_date && (
              <button className="adm-link" onClick={() => update({ followUpDate: '' }, 'Follow-up date')}>Clear follow-up ({fmtDate(l.follow_up_date)})</button>
            )}
            <label className="adm-check">
              <input type="checkbox" checked={l.is_demo_request} disabled={!!saving} onChange={(e) => update({ isDemoRequest: e.target.checked }, 'Demo request')} />
              Demo requested
            </label>
            {saving && <p className="adm-muted">Saving {saving.toLowerCase()}…</p>}
          </section>

          <section className="adm-card">
            <h2>Lead history</h2>
            <ol className="adm-history">
              {data.history.map((h) => (
                <li key={h.id}>
                  <strong>{h.action}{h.field && h.action !== 'Status changed' && h.action !== 'Assigned' ? `: ${h.field}` : ''}</strong>
                  {(h.old_value || h.new_value) && h.field !== 'Project description' && (
                    <span>{h.old_value ? `${h.old_value} → ` : ''}{h.new_value || '(cleared)'}</span>
                  )}
                  <small>{h.admin_name || 'Website'} · {fmtDateTime(h.created_at)}</small>
                </li>
              ))}
            </ol>
          </section>

          {admin?.role === 'super_admin' && (
            <button
              className="adm-btn adm-btn-danger"
              onClick={async () => {
                if (!confirm(`Delete lead ${l.lead_code} permanently? This cannot be undone.`)) return
                try {
                  await api(`/admin/leads/${id}`, { method: 'DELETE' })
                  nav('/admin/leads', { replace: true })
                } catch (e) {
                  setError((e as Error).message)
                }
              }}
            >
              Delete lead
            </button>
          )}
        </aside>
      </div>
    </>
  )
}
