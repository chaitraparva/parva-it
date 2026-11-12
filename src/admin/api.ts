// Admin API client. Sessions live in an httpOnly cookie set by the server, so nothing
// sensitive is kept in localStorage.
import type { Role, LeadStatus } from '../lib/options'

export class ApiError extends Error {
  constructor(public status: number, message: string, public fields?: Record<string, string>) {
    super(message)
  }
}

export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'parva-admin',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event('parva-admin:signed-out'))
    throw new ApiError(res.status, data.error || 'Something went wrong.', data.fields)
  }
  return data as T
}

export const post = <T,>(path: string, body: unknown) => api<T>(path, { method: 'POST', body: JSON.stringify(body) })
export const patch = <T,>(path: string, body: unknown) => api<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
export const put = <T,>(path: string, body: unknown) => api<T>(path, { method: 'PUT', body: JSON.stringify(body) })

export interface AdminUser {
  id: string
  email: string
  name: string
  role: Role
}

export interface LeadRow {
  id: string
  lead_code: string
  full_name: string
  company: string | null
  email: string
  phone: string
  industry: string | null
  service: string
  project_interest: string | null
  source: string
  status: LeadStatus
  is_demo_request: boolean
  follow_up_date: string | null
  created_at: string
  assigned_to: string | null
  assigned_name: string | null
}

export interface Lead extends LeadRow {
  description: string
  budget: string | null
  updated_at: string
}

export interface LeadDetailResponse {
  lead: Lead
  notes: { id: string; note: string; created_at: string; admin_name: string | null }[]
  history: {
    id: string
    action: string
    field: string | null
    old_value: string | null
    new_value: string | null
    created_at: string
    admin_name: string | null
  }[]
}

export interface TeamMember {
  id: string
  name: string
  role: Role
  email?: string
  active?: boolean
  last_login_at?: string | null
  open_leads?: number
}

export const fmtDate = (s: string | null | undefined) =>
  s ? new Date(s.length === 10 ? s + 'T00:00:00' : s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
export const fmtDateTime = (s: string) =>
  new Date(s).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
