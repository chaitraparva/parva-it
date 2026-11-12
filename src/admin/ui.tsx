import { useEffect, useState, type ReactNode } from 'react'
import type { LeadStatus } from '../lib/options'

export function StatusBadge({ status }: { status: LeadStatus | string }) {
  const tone =
    status === 'Converted' ? 'good' : status === 'Lost' ? 'lost' : status === 'New' ? 'new' : status === 'Contacted' ? 'info' : 'progress'
  return <span className={`adm-badge tone-${tone}`}>{status}</span>
}

export function PageHead({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  useEffect(() => {
    document.title = `${title} · Parva IT Admin`
  }, [title])
  return (
    <div className="adm-pagehead">
      <div>
        <h1>{title}</h1>
        {sub && <p className="adm-muted">{sub}</p>}
      </div>
      {actions && <div className="adm-actions">{actions}</div>}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="adm-empty">{children}</div>
}

export function ErrorNote({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="adm-alert" role="alert">
      {error} {onRetry && <button className="adm-link" onClick={onRetry}>Try again</button>}
    </div>
  )
}

/** Single-series horizontal bars: label, bar, value. Hover/focus shows the share. */
export function BarList({ data, onSelect }: { data: { label: string; value: number }[]; onSelect?: (label: string) => void }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  if (!data.length) return <Empty>No leads yet.</Empty>
  return (
    <ul className="adm-barlist">
      {data.map((d) => (
        <li key={d.label}>
          <button
            type="button"
            disabled={!onSelect}
            onClick={() => onSelect?.(d.label)}
            title={`${d.label}: ${d.value} lead${d.value === 1 ? '' : 's'} (${Math.round((d.value / total) * 100)}%)`}
          >
            <span className="adm-barlist-label">{d.label}</span>
            <span className="adm-barlist-track">
              <i style={{ width: `${(d.value / max) * 100}%` }} />
            </span>
            <span className="adm-barlist-value">{d.value}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/** Single-series column chart for the monthly trend, with a hover tooltip and a table toggle. */
export function MonthlyChart({ data }: { data: { month: string; value: number }[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const [table, setTable] = useState(false)
  const max = Math.max(1, ...data.map((d) => d.value))
  const nice = Math.max(4, Math.ceil(max / 4) * 4)
  const label = (m: string) => new Date(m + '-01T00:00:00').toLocaleDateString('en-GB', { month: 'short' })
  const full = (m: string) => new Date(m + '-01T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  return (
    <div>
      <div className="adm-chart-toolbar">
        <button className="adm-link" onClick={() => setTable((t) => !t)}>{table ? 'Show chart' : 'Show table'}</button>
      </div>
      {table ? (
        <table className="adm-table compact">
          <thead><tr><th>Month</th><th className="num">Inquiries</th></tr></thead>
          <tbody>{data.map((d) => <tr key={d.month}><td>{full(d.month)}</td><td className="num">{d.value}</td></tr>)}</tbody>
        </table>
      ) : (
        <div className="adm-columns" role="img" aria-label={`Inquiries per month, last 12 months. ${data.map((d) => `${full(d.month)}: ${d.value}`).join(', ')}`}>
          <div className="adm-columns-grid">
            {[nice, nice / 2, 0].map((v) => (
              <span key={v}><b>{v}</b></span>
            ))}
          </div>
          <div className="adm-columns-bars">
            {data.map((d, i) => (
              <div
                key={d.month}
                className="adm-col"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <i style={{ height: `${(d.value / nice) * 100}%` }} className={hover === i ? 'hover' : ''} />
                {hover === i && (
                  <span className="adm-tip">
                    <b>{d.value}</b> {d.value === 1 ? 'inquiry' : 'inquiries'}
                    <small>{full(d.month)}</small>
                  </span>
                )}
                <small>{label(d.month)}</small>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
