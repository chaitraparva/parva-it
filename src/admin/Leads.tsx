import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { api, post, fmtDate, fmtDateTime, type LeadRow, type TeamMember, type LeadDetailResponse } from './api'
import { useAuth } from './auth'
import { PageHead, StatusBadge, Empty, ErrorNote } from './ui'
import { LEAD_STATUSES, REQUIREMENTS, PROJECT_INTERESTS, LEAD_SOURCES, INDUSTRIES, BUDGETS } from '../lib/options'

const FILTER_KEYS = ['q', 'status', 'service', 'project', 'source', 'assigned', 'followUp', 'demo', 'from', 'to', 'sort'] as const

export function useTeam() {
  const [team, setTeam] = useState<TeamMember[]>([])
  useEffect(() => {
    api<{ team: TeamMember[] }>('/admin/team').then((r) => setTeam(r.team.filter((m) => m.active !== false))).catch(() => setTeam([]))
  }, [])
  return team
}

export default function Leads() {
  const { admin } = useAuth()
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()
  const team = useTeam()
  const [data, setData] = useState<{ rows: LeadRow[]; total: number; page: number; pageSize: number } | null>(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState(params.get('q') || '')
  const [adding, setAdding] = useState(false)
  const canExport = admin?.role === 'super_admin' || admin?.role === 'manager'

  const query = params.toString()
  const load = useCallback(() => {
    setError('')
    api<typeof data>(`/admin/leads?${query}`).then(setData).catch((e) => setError(e.message))
  }, [query])
  useEffect(load, [load])

  // Debounced search box
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('q') || '') !== search) setFilter('q', search)
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setParams(next, { replace: true })
  }
  const active = FILTER_KEYS.some((k) => k !== 'sort' && params.get(k))
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1
  const page = Number(params.get('page')) || 1

  return (
    <>
      <PageHead
        title="Leads"
        sub={data ? `${data.total} lead${data.total === 1 ? '' : 's'}${active ? ' match these filters' : ''}` : 'Loading…'}
        actions={
          <>
            <button className="adm-btn adm-btn-ghost" onClick={() => setAdding(true)}>Add lead</button>
            {canExport && (
              <a className="adm-btn adm-btn-gold" href={`/api/admin/leads/export?${query}`} download>
                Export CSV
              </a>
            )}
          </>
        }
      />

      <div className="adm-filters">
        <input
          type="search"
          placeholder="Search name, company, email, phone, ID or description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search leads"
          className="adm-search"
        />
        <select value={params.get('status') || ''} onChange={(e) => setFilter('status', e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          <option value="open">Open (not converted or lost)</option>
          <option value="qualified">Qualified</option>
          {LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={params.get('service') || ''} onChange={(e) => setFilter('service', e.target.value)} aria-label="Service">
          <option value="">All services</option>
          {REQUIREMENTS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={params.get('project') || ''} onChange={(e) => setFilter('project', e.target.value)} aria-label="Project interest">
          <option value="">All project interests</option>
          {PROJECT_INTERESTS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={params.get('assigned') || ''} onChange={(e) => setFilter('assigned', e.target.value)} aria-label="Assigned person">
          <option value="">Anyone assigned</option>
          <option value="unassigned">Unassigned</option>
          {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select value={params.get('followUp') || ''} onChange={(e) => setFilter('followUp', e.target.value)} aria-label="Follow-up">
          <option value="">Any follow-up</option>
          <option value="overdue">Follow-up overdue</option>
          <option value="week">Follow-up in next 7 days</option>
        </select>
        <select value={params.get('source') || ''} onChange={(e) => setFilter('source', e.target.value)} aria-label="Source">
          <option value="">All sources</option>
          {LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <label className="adm-check">
          <input type="checkbox" checked={params.get('demo') === '1'} onChange={(e) => setFilter('demo', e.target.checked ? '1' : '')} />
          Demo requests
        </label>
        <label className="adm-inline">From <input type="date" value={params.get('from') || ''} onChange={(e) => setFilter('from', e.target.value)} /></label>
        <label className="adm-inline">To <input type="date" value={params.get('to') || ''} onChange={(e) => setFilter('to', e.target.value)} /></label>
        <select value={params.get('sort') || 'newest'} onChange={(e) => setFilter('sort', e.target.value === 'newest' ? '' : e.target.value)} aria-label="Sort">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="follow_up">Follow-up date</option>
          <option value="name">Name A–Z</option>
        </select>
        {active && (
          <button className="adm-link" onClick={() => { setSearch(''); setParams(new URLSearchParams(), { replace: true }) }}>
            Clear filters
          </button>
        )}
      </div>

      {error ? (
        <ErrorNote error={error} onRetry={load} />
      ) : !data ? (
        <div className="adm-loading">Loading leads…</div>
      ) : data.rows.length === 0 ? (
        <Empty>{active ? 'No leads match these filters.' : 'No leads yet. Website inquiries will appear here automatically.'}</Empty>
      ) : (
        <div className="adm-card flush">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Lead</th><th>Customer</th><th>Contact</th><th>Service / interest</th><th>Received</th>
                  <th>Assigned</th><th>Follow-up</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => {
                  const overdue = r.follow_up_date && r.follow_up_date < new Date().toISOString().slice(0, 10) && !['Converted', 'Lost'].includes(r.status)
                  return (
                    <tr key={r.id} className="clickable" onClick={() => nav(`/admin/leads/${r.id}`)}>
                      <td>
                        <Link to={`/admin/leads/${r.id}`} onClick={(e) => e.stopPropagation()}>{r.lead_code}</Link>
                        {r.is_demo_request && <span className="adm-chip">Demo</span>}
                      </td>
                      <td><strong>{r.full_name}</strong><small>{r.company || '—'}</small></td>
                      <td><span>{r.email}</span><small>{r.phone}</small></td>
                      <td><span>{r.service}</span><small>{r.project_interest || r.source}</small></td>
                      <td>{fmtDateTime(r.created_at)}</td>
                      <td>{r.assigned_name || <span className="adm-muted">Unassigned</span>}</td>
                      <td className={overdue ? 'adm-overdue' : ''}>{fmtDate(r.follow_up_date)}</td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="adm-pager">
              <button className="adm-btn adm-btn-ghost" disabled={page <= 1} onClick={() => setFilter('page', String(page - 1))}>Previous</button>
              <span className="adm-muted">Page {page} of {pages}</span>
              <button className="adm-btn adm-btn-ghost" disabled={page >= pages} onClick={() => setFilter('page', String(page + 1))}>Next</button>
            </div>
          )}
        </div>
      )}
      {adding && <AddLeadModal onClose={() => setAdding(false)} onCreated={(id) => nav(`/admin/leads/${id}`)} />}
    </>
  )
}

function AddLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [f, setF] = useState({
    fullName: '', company: '', email: '', phone: '', industry: '', service: '', projectInterest: '', description: '', budget: '', source: 'Phone',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }))
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const r = await post<LeadDetailResponse>('/admin/leads', f)
      onCreated(r.lead.id)
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }
  return (
    <div className="adm-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="adm-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-label="Add lead">
        <h2>Add a lead</h2>
        <p className="adm-muted">For inquiries received by phone, email or referral. Website inquiries are added automatically.</p>
        <div className="adm-form-grid">
          <label>Customer name *<input required value={f.fullName} onChange={set('fullName')} /></label>
          <label>Company<input value={f.company} onChange={set('company')} /></label>
          <label>Email *<input required type="email" value={f.email} onChange={set('email')} /></label>
          <label>Phone *<input required value={f.phone} onChange={set('phone')} /></label>
          <label>Industry<select value={f.industry} onChange={set('industry')}><option value="">—</option>{INDUSTRIES.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label>Interested service *<select required value={f.service} onChange={set('service')}><option value="">Select</option>{REQUIREMENTS.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label>Project interest<select value={f.projectInterest} onChange={set('projectInterest')}><option value="">—</option>{PROJECT_INTERESTS.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label>Lead source *<select required value={f.source} onChange={set('source')}>{LEAD_SOURCES.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label>Budget<select value={f.budget} onChange={set('budget')}><option value="">—</option>{BUDGETS.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label className="span-2">Project description *<textarea required rows={4} value={f.description} onChange={set('description')} /></label>
        </div>
        {error && <p className="adm-alert" role="alert">{error}</p>}
        <div className="adm-modal-actions">
          <button type="button" className="adm-btn adm-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="adm-btn adm-btn-gold" disabled={busy}>{busy ? 'Saving…' : 'Create lead'}</button>
        </div>
      </form>
    </div>
  )
}
