import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { api, fmtDate, fmtDateTime } from './api'
import { PageHead, StatusBadge, BarList, MonthlyChart, Empty, ErrorNote } from './ui'

interface DashboardData {
  counts: { total: number; new: number; contacted: number; qualified: number; demo_requests: number; converted: number; lost: number }
  recent: { id: string; lead_code: string; full_name: string; company: string | null; service: string; status: string; created_at: string; assigned_name: string | null }[]
  byService: { label: string; value: number }[]
  byProject: { label: string; value: number }[]
  monthly: { month: string; value: number }[]
  followUps: { id: string; lead_code: string; full_name: string; company: string | null; status: string; follow_up_date: string; assigned_name: string | null; overdue: boolean }[]
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')
  const nav = useNavigate()
  const load = useCallback(() => {
    setError('')
    api<DashboardData>('/admin/dashboard').then(setData).catch((e) => setError(e.message))
  }, [])
  useEffect(load, [load])

  if (error) return <ErrorNote error={error} onRetry={load} />
  if (!data) return <div className="adm-loading">Loading dashboard…</div>
  const c = data.counts

  const tiles: [string, number, string, string][] = [
    ['Total inquiries', c.total, '/admin/leads', 'All leads received'],
    ['New leads', c.new, '/admin/leads?status=New', 'Not yet contacted'],
    ['Contacted', c.contacted, '/admin/leads?status=Contacted', 'First contact made'],
    ['Qualified', c.qualified, '/admin/leads?status=qualified', 'Interested → Negotiation'],
    ['Demo requests', c.demo_requests, '/admin/leads?demo=1', 'Asked for a demo'],
    ['Converted clients', c.converted, '/admin/leads?status=Converted', 'Won'],
  ]

  return (
    <>
      <PageHead
        title="Dashboard"
        sub="All figures come from the live lead database."
        actions={<button className="adm-btn adm-btn-ghost" onClick={load}>Refresh</button>}
      />
      <div className="adm-tiles">
        {tiles.map(([label, value, to, hint]) => (
          <Link key={label} to={to} className="adm-tile">
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{hint}</small>
          </Link>
        ))}
      </div>

      <div className="adm-grid-2">
        <section className="adm-card">
          <div className="adm-card-head">
            <h2>Follow-up reminders</h2>
            <Link className="adm-link" to="/admin/leads?followUp=week&sort=follow_up">View all</Link>
          </div>
          {data.followUps.length === 0 ? (
            <Empty>No follow-ups due in the next 7 days.</Empty>
          ) : (
            <ul className="adm-followups">
              {data.followUps.map((f) => (
                <li key={f.id}>
                  <Link to={`/admin/leads/${f.id}`}>
                    <span className={`adm-date ${f.overdue ? 'overdue' : ''}`}>
                      {f.overdue ? 'Overdue · ' : ''}
                      {fmtDate(f.follow_up_date)}
                    </span>
                    <strong>{f.full_name}</strong>
                    <small>
                      {f.company || '—'} · {f.assigned_name || 'Unassigned'}
                    </small>
                  </Link>
                  <StatusBadge status={f.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="adm-card">
          <div className="adm-card-head">
            <h2>Monthly inquiry trend</h2>
            <span className="adm-muted">Last 12 months</span>
          </div>
          <MonthlyChart data={data.monthly} />
        </section>
      </div>

      <section className="adm-card">
        <div className="adm-card-head">
          <h2>Recent inquiries</h2>
          <Link className="adm-link" to="/admin/leads">All leads</Link>
        </div>
        {data.recent.length === 0 ? (
          <Empty>No inquiries yet. Submissions from the website contact form will appear here.</Empty>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>Lead</th><th>Customer</th><th>Service</th><th>Received</th><th>Assigned</th><th>Status</th></tr>
              </thead>
              <tbody>
                {data.recent.map((r) => (
                  <tr key={r.id} onClick={() => nav(`/admin/leads/${r.id}`)} className="clickable">
                    <td><Link to={`/admin/leads/${r.id}`}>{r.lead_code}</Link></td>
                    <td><strong>{r.full_name}</strong><small>{r.company}</small></td>
                    <td>{r.service}</td>
                    <td>{fmtDateTime(r.created_at)}</td>
                    <td>{r.assigned_name || <span className="adm-muted">Unassigned</span>}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="adm-grid-2">
        <section className="adm-card">
          <div className="adm-card-head"><h2>Leads by service</h2></div>
          <BarList data={data.byService} onSelect={(s) => nav(`/admin/leads?service=${encodeURIComponent(s)}`)} />
        </section>
        <section className="adm-card">
          <div className="adm-card-head"><h2>Leads by project interest</h2></div>
          <BarList
            data={data.byProject}
            onSelect={(p) => p !== 'No specific project' && nav(`/admin/leads?project=${encodeURIComponent(p)}`)}
          />
        </section>
      </div>
    </>
  )
}
