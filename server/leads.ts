// Admin lead management: dashboard stats, list/search/filter, detail, edits with history,
// notes, follow-ups and CSV export.
import { db, HttpError, readJson, type Ctx } from './core'
import type { Admin } from './auth'
import { validDate, validStatus, EMAIL_RE } from './validate'
import { QUALIFIED_STATUSES, LEAD_SOURCES, INDUSTRIES, REQUIREMENTS, BUDGETS, PROJECT_INTERESTS } from '../src/lib/options'

export async function dashboard() {
  const q = (sql: string, params: unknown[] = []) => db().query(sql, params).then((r) => r.rows)
  const [counts] = await q(
    `select count(*)::int as total,
            count(*) filter (where status = 'New')::int as new,
            count(*) filter (where status = 'Contacted')::int as contacted,
            count(*) filter (where status = any($1))::int as qualified,
            count(*) filter (where is_demo_request)::int as demo_requests,
            count(*) filter (where status = 'Converted')::int as converted,
            count(*) filter (where status = 'Lost')::int as lost
     from leads`,
    [QUALIFIED_STATUSES],
  )
  const recent = await q(
    `select l.id, l.lead_code, l.full_name, l.company, l.service, l.status, l.created_at, a.name as assigned_name
     from leads l left join admins a on a.id = l.assigned_to order by l.created_at desc limit 8`,
  )
  const byService = await q(`select service as label, count(*)::int as value from leads group by 1 order by 2 desc, 1`)
  const byProject = await q(
    `select coalesce(project_interest, 'No specific project') as label, count(*)::int as value from leads group by 1 order by 2 desc, 1`,
  )
  const byStatus = await q(`select status as label, count(*)::int as value from leads group by 1`)
  const monthly = await q(
    `with months as (
       select generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') as m)
     select to_char(m, 'YYYY-MM') as month, count(l.id)::int as value
     from months left join leads l on date_trunc('month', l.created_at) = m
     group by m order by m`,
  )
  const followUps = await q(
    `select l.id, l.lead_code, l.full_name, l.company, l.status, l.follow_up_date::text as follow_up_date, a.name as assigned_name,
            (l.follow_up_date < current_date) as overdue
     from leads l left join admins a on a.id = l.assigned_to
     where l.follow_up_date is not null and l.follow_up_date <= current_date + 7 and l.status not in ('Converted','Lost')
     order by l.follow_up_date asc limit 12`,
  )
  return { counts, recent, byService, byProject, byStatus, monthly, followUps }
}

const SORTS: Record<string, string> = {
  newest: 'l.created_at desc',
  oldest: 'l.created_at asc',
  follow_up: 'l.follow_up_date asc nulls last',
  name: 'l.full_name asc',
}

function buildFilters(query: URLSearchParams) {
  const where: string[] = []
  const params: unknown[] = []
  const add = (sql: string, v: unknown) => {
    params.push(v)
    where.push(sql.replace('?', `$${params.length}`))
  }
  const search = query.get('q')?.trim()
  if (search) {
    params.push(`%${search.replace(/[%_\\]/g, (c) => '\\' + c)}%`)
    const p = `$${params.length}`
    where.push(`(l.full_name ilike ${p} or l.company ilike ${p} or l.email ilike ${p} or l.phone ilike ${p} or l.lead_code ilike ${p} or l.description ilike ${p})`)
  }
  const status = query.get('status')
  if (status === 'open') where.push(`l.status not in ('Converted','Lost')`)
  else if (status === 'qualified') add('l.status = any(?)', QUALIFIED_STATUSES)
  else if (status && validStatus(status)) add('l.status = ?', status)
  const service = query.get('service')
  if (service) add('l.service = ?', service)
  const project = query.get('project')
  if (project) add('l.project_interest = ?', project)
  const source = query.get('source')
  if (source) add('l.source = ?', source)
  const assigned = query.get('assigned')
  if (assigned === 'unassigned') where.push('l.assigned_to is null')
  else if (assigned && /^[0-9a-f-]{36}$/i.test(assigned)) add('l.assigned_to = ?', assigned)
  if (query.get('demo') === '1') where.push('l.is_demo_request')
  const followUp = query.get('followUp')
  if (followUp === 'overdue') where.push(`l.follow_up_date < current_date and l.status not in ('Converted','Lost')`)
  if (followUp === 'week') where.push(`l.follow_up_date between current_date and current_date + 7`)
  const from = query.get('from')
  if (from && validDate(from)) add('l.created_at >= ?::date', from)
  const to = query.get('to')
  if (to && validDate(to)) add(`l.created_at < (?::date + 1)`, to)
  return { where: where.length ? `where ${where.join(' and ')}` : '', params }
}

export async function listLeads(ctx: Ctx) {
  const { where, params } = buildFilters(ctx.query)
  const page = Math.max(1, Number(ctx.query.get('page')) || 1)
  const pageSize = Math.min(100, Math.max(5, Number(ctx.query.get('pageSize')) || 20))
  const order = SORTS[ctx.query.get('sort') || 'newest'] || SORTS.newest
  const total = await db().query(`select count(*)::int as n from leads l ${where}`, params)
  const { rows } = await db().query(
    `select l.id, l.lead_code, l.full_name, l.company, l.email, l.phone, l.industry, l.service, l.project_interest,
            l.source, l.status, l.is_demo_request, l.follow_up_date::text as follow_up_date, l.created_at,
            l.assigned_to, a.name as assigned_name
     from leads l left join admins a on a.id = l.assigned_to ${where}
     order by ${order}, l.id desc limit ${pageSize} offset ${(page - 1) * pageSize}`,
    params,
  )
  return { rows, total: total.rows[0].n, page, pageSize }
}

export async function getLead(id: number) {
  const { rows } = await db().query(
    `select l.*, l.follow_up_date::text as follow_up_date, a.name as assigned_name
     from leads l left join admins a on a.id = l.assigned_to where l.id = $1`,
    [id],
  )
  if (!rows[0]) throw new HttpError(404, 'Lead not found.')
  const lead = rows[0]
  delete lead.ip_hash
  delete lead.content_hash
  delete lead.idempotency_key
  const notes = await db().query(
    `select n.id, n.note, n.created_at, a.name as admin_name from lead_notes n left join admins a on a.id = n.admin_id
     where n.lead_id = $1 order by n.created_at desc`,
    [id],
  )
  const history = await db().query(
    `select h.id, h.action, h.field, h.old_value, h.new_value, h.created_at, a.name as admin_name
     from lead_history h left join admins a on a.id = h.admin_id where h.lead_id = $1 order by h.created_at desc, h.id desc`,
    [id],
  )
  return { lead, notes: notes.rows, history: history.rows }
}

// Editable fields → [column, label, validator]
const EDITABLE: Record<string, [string, string, (v: unknown) => string | null]> = {
  fullName: ['full_name', 'Customer name', (v) => req(v, 2, 120)],
  company: ['company', 'Company', (v) => opt(v, 160)],
  email: ['email', 'Email', (v) => { const s = req(v, 3, 200).toLowerCase(); if (!EMAIL_RE.test(s)) throw new HttpError(422, 'Enter a valid email.'); return s }],
  phone: ['phone', 'Phone', (v) => req(v, 6, 30)],
  industry: ['industry', 'Industry', (v) => oneOf(v, INDUSTRIES, true)],
  service: ['service', 'Interested service', (v) => oneOf(v, REQUIREMENTS) as string],
  projectInterest: ['project_interest', 'Project interest', (v) => oneOf(v, PROJECT_INTERESTS, true)],
  description: ['description', 'Project description', (v) => req(v, 1, 5000)],
  budget: ['budget', 'Budget', (v) => oneOf(v, BUDGETS, true)],
  source: ['source', 'Lead source', (v) => oneOf(v, LEAD_SOURCES) as string],
  status: ['status', 'Status', (v) => { if (!validStatus(v)) throw new HttpError(422, 'Invalid status.'); return v }],
  followUpDate: ['follow_up_date', 'Follow-up date', (v) => { if (v === '' || v === null) return null; if (!validDate(v)) throw new HttpError(422, 'Invalid follow-up date.'); return v as string }],
  isDemoRequest: ['is_demo_request', 'Demo request', (v) => (v ? 'true' : 'false')],
}
function req(v: unknown, min: number, max: number) {
  const s = typeof v === 'string' ? v.trim() : ''
  if (s.length < min || s.length > max) throw new HttpError(422, 'A required field is empty or too long.')
  return s
}
function opt(v: unknown, max: number) {
  const s = typeof v === 'string' ? v.trim().slice(0, max) : ''
  return s || null
}
function oneOf(v: unknown, list: string[], optional = false) {
  if ((v === '' || v === null || v === undefined) && optional) return null
  if (typeof v !== 'string' || !list.includes(v)) throw new HttpError(422, 'Choose a value from the list.')
  return v
}

export async function updateLead(ctx: Ctx, id: number, admin: Admin) {
  const body = await readJson<Record<string, unknown>>(ctx.req)
  const { rows } = await db().query(`select * from leads where id = $1`, [id])
  const cur = rows[0]
  if (!cur) throw new HttpError(404, 'Lead not found.')

  const sets: string[] = []
  const params: unknown[] = []
  const changes: [string, string, string | null, string | null][] = []

  for (const [key, [col, label, check]] of Object.entries(EDITABLE)) {
    if (!(key in body)) continue
    const next = check(body[key])
    const prev = cur[col] instanceof Date ? cur[col].toISOString().slice(0, 10) : cur[col] === null ? null : String(cur[col])
    if ((prev ?? null) === (next ?? null)) continue
    params.push(col === 'is_demo_request' ? next === 'true' : next)
    sets.push(`${col} = $${params.length}`)
    changes.push([key === 'status' ? 'Status changed' : 'Updated', label, prev, next])
  }

  if ('assignedTo' in body) {
    const v = body.assignedTo
    let nextId: string | null = null
    let nextName: string | null = null
    if (v) {
      if (admin.role === 'executive' && v !== admin.id) throw new HttpError(403, 'Sales executives can only assign leads to themselves.')
      const a = await db().query(`select id, name from admins where id = $1 and active`, [v])
      if (!a.rows[0]) throw new HttpError(422, 'Choose an active team member.')
      ;[nextId, nextName] = [a.rows[0].id, a.rows[0].name]
    }
    if ((cur.assigned_to || null) !== nextId) {
      const prevName = cur.assigned_to ? (await db().query(`select name from admins where id = $1`, [cur.assigned_to])).rows[0]?.name : null
      params.push(nextId)
      sets.push(`assigned_to = $${params.length}`)
      changes.push(['Assigned', 'Assigned person', prevName || 'Unassigned', nextName || 'Unassigned'])
    }
  }

  if (!sets.length) return getLead(id)
  params.push(id)
  const client = await db().connect()
  try {
    await client.query('begin')
    await client.query(`update leads set ${sets.join(', ')}, updated_at = now() where id = $${params.length}`, params)
    for (const [action, field, oldV, newV] of changes) {
      await client.query(
        `insert into lead_history(lead_id, admin_id, action, field, old_value, new_value) values ($1,$2,$3,$4,$5,$6)`,
        [id, admin.id, action, field, oldV?.slice(0, 500) ?? null, newV?.slice(0, 500) ?? null],
      )
    }
    await client.query('commit')
  } catch (e) {
    await client.query('rollback')
    throw e
  } finally {
    client.release()
  }
  return getLead(id)
}

export async function addNote(ctx: Ctx, id: number, admin: Admin) {
  const body = await readJson<{ note?: string }>(ctx.req)
  const note = typeof body.note === 'string' ? body.note.trim() : ''
  if (!note) throw new HttpError(422, 'Write a note first.')
  if (note.length > 4000) throw new HttpError(422, 'Notes can be up to 4,000 characters.')
  const exists = await db().query(`select 1 from leads where id = $1`, [id])
  if (!exists.rows[0]) throw new HttpError(404, 'Lead not found.')
  await db().query(`insert into lead_notes(lead_id, admin_id, note) values ($1,$2,$3)`, [id, admin.id, note])
  await db().query(`insert into lead_history(lead_id, admin_id, action) values ($1,$2,'Note added')`, [id, admin.id])
  await db().query(`update leads set updated_at = now() where id = $1`, [id])
  return getLead(id)
}

export async function createManualLead(ctx: Ctx, admin: Admin) {
  // Leads that arrive by phone, email or referral can be entered by the team.
  const body = await readJson<Record<string, unknown>>(ctx.req)
  const v = (k: string) => EDITABLE[k][2](body[k])
  const source = v('source')
  const { rows } = await db().query(
    `insert into leads(full_name, company, email, phone, industry, service, project_interest, description, budget, source,
                       is_demo_request, content_hash, assigned_to)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, md5(random()::text), $12) returning id`,
    [v('fullName'), v('company'), v('email'), v('phone'), v('industry'), v('service'), v('projectInterest'),
     v('description'), v('budget'), source, body.service === 'Request a Demo', admin.role === 'executive' ? admin.id : null],
  )
  await db().query(`insert into lead_history(lead_id, admin_id, action, new_value) values ($1,$2,'Lead created',$3)`, [rows[0].id, admin.id, source])
  return getLead(rows[0].id)
}

const csvCell = (v: unknown) => {
  let s = v === null || v === undefined ? '' : v instanceof Date ? v.toISOString() : String(v)
  if (/^[=@\t\r]/.test(s) || /^[+\-](?![\d\s()+-]+$)/.test(s)) s = `'${s}` // stop spreadsheet formula injection
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function exportLeads(ctx: Ctx, admin: Admin) {
  const { where, params } = buildFilters(ctx.query)
  const { rows } = await db().query(
    `select l.lead_code, l.full_name, l.company, l.email, l.phone, l.industry, l.service, l.project_interest, l.description,
            l.budget, l.created_at, l.source, l.status, a.name as assigned_name, l.follow_up_date::text as follow_up_date,
            (select string_agg(to_char(n.created_at, 'YYYY-MM-DD') || ': ' || n.note, ' | ' order by n.created_at)
               from lead_notes n where n.lead_id = l.id) as notes
     from leads l left join admins a on a.id = l.assigned_to ${where} order by l.created_at desc`,
    params,
  )
  const head = ['Lead ID', 'Customer Name', 'Company', 'Email', 'Phone', 'Industry', 'Interested Service', 'Project Interest',
    'Project Description', 'Budget', 'Inquiry Date', 'Lead Source', 'Lead Status', 'Assigned Person', 'Follow-up Date', 'Internal Notes']
  const lines = [head.join(',')]
  for (const r of rows) lines.push(Object.values(r).map(csvCell).join(','))
  console.info(`Lead export by ${admin.email}: ${rows.length} rows`)
  ctx.res.statusCode = 200
  ctx.res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  ctx.res.setHeader('Cache-Control', 'no-store')
  ctx.res.setHeader('Content-Disposition', `attachment; filename="parva-it-leads-${new Date().toISOString().slice(0, 10)}.csv"`)
  ctx.res.end('﻿' + lines.join('\r\n'))
}
