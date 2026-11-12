// One router for every /api/* endpoint. Used by the Vercel function (api/[...path].ts)
// and by the local dev server (server/dev.ts).
import { db, HttpError, readJson, sendJson, clientIp, isProd, type Ctx, type Req, type Res } from './core'
import {
  login, logout, currentAdmin, requireAdmin, createPasswordReset, resetPassword, hashPassword, checkPasswordStrength,
} from './auth'
import { createInquiry } from './inquiries'
import { dashboard, listLeads, getLead, updateLead, addNote, exportLeads, createManualLead } from './leads'
import { sendMail, mailConfigured, siteUrl, esc } from './mail'
import { ROLES, type Role } from '../src/lib/options'
import { EMAIL_RE } from './validate'

type Handler = (ctx: Ctx, params: string[]) => Promise<unknown>
const routes: [string, RegExp, Handler][] = []
const on = (method: string, pattern: string, h: Handler) =>
  routes.push([method, new RegExp('^' + pattern.replace(/:\w+/g, '([^/]+)') + '/?$'), h])

const MANAGERS: Role[] = ['super_admin', 'manager']

/* ---------- public ---------- */
on('GET', '/health', async () => {
  await db().query('select 1')
  return { ok: true }
})
on('POST', '/inquiries', (ctx) => createInquiry(ctx))

/* ---------- auth ---------- */
on('POST', '/auth/login', async (ctx) => {
  const b = await readJson(ctx.req)
  return { admin: await login(ctx, b.email, b.password) }
})
on('POST', '/auth/logout', async (ctx) => {
  await logout(ctx)
  return { ok: true }
})
on('GET', '/auth/me', async (ctx) => {
  const admin = await currentAdmin(ctx)
  if (!admin) throw new HttpError(401, 'Not signed in.')
  return { admin }
})
on('POST', '/auth/forgot-password', async (ctx) => {
  const b = await readJson(ctx.req)
  const r = await createPasswordReset(b.email)
  if (r) {
    const link = `${siteUrl()}/admin/reset-password?token=${encodeURIComponent(r.token)}`
    const sent = await sendMail(
      [r.admin.email],
      'Reset your Parva IT admin password',
      `Hello ${r.admin.name},\n\nUse this link within 1 hour to set a new password:\n${link}\n\nIf you did not ask for this, you can ignore this email.`,
      `<p>Hello ${esc(r.admin.name)},</p><p>Use this link within 1 hour to set a new password:</p><p><a href="${esc(link)}">Reset my password</a></p><p>If you did not ask for this, you can ignore this email.</p>`,
    ).catch((e) => (console.error('Reset email failed', e), false))
    if (!sent) {
      // Never write reset links to production logs.
      if (isProd()) console.warn(`[password reset] Email is not configured; no reset email sent to ${r.admin.email}.`)
      else console.warn(`[password reset] Email is not configured. Local reset link for ${r.admin.email}: ${link}`)
    }
  }
  // Same answer whether or not the account exists.
  return { ok: true, message: 'If that email belongs to an admin account, a reset link has been sent to it.' }
})
on('POST', '/auth/reset-password', async (ctx) => {
  const b = await readJson(ctx.req)
  await resetPassword(b.token, b.password)
  return { ok: true }
})
on('POST', '/auth/change-password', async (ctx) => {
  const admin = await requireAdmin(ctx)
  const b = await readJson(ctx.req)
  const { rows } = await db().query(`select password_hash from admins where id = $1`, [admin.id])
  const bcrypt = (await import('bcryptjs')).default
  if (!(await bcrypt.compare(String(b.currentPassword || ''), rows[0].password_hash))) throw new HttpError(422, 'Your current password is incorrect.')
  const pw = checkPasswordStrength(b.newPassword)
  await db().query(`update admins set password_hash = $1 where id = $2`, [await hashPassword(pw), admin.id])
  return { ok: true }
})

/* ---------- dashboard & leads ---------- */
on('GET', '/admin/dashboard', async (ctx) => {
  await requireAdmin(ctx)
  return dashboard()
})
on('GET', '/admin/leads', async (ctx) => {
  await requireAdmin(ctx)
  return listLeads(ctx)
})
on('POST', '/admin/leads', async (ctx) => createManualLead(ctx, await requireAdmin(ctx)))
on('GET', '/admin/leads/export', async (ctx) => {
  const admin = await requireAdmin(ctx, MANAGERS)
  await exportLeads(ctx, admin)
  return undefined
})
on('GET', '/admin/leads/:id', async (ctx, [id]) => {
  await requireAdmin(ctx)
  return getLead(leadId(id))
})
on('PATCH', '/admin/leads/:id', async (ctx, [id]) => updateLead(ctx, leadId(id), await requireAdmin(ctx)))
on('POST', '/admin/leads/:id/notes', async (ctx, [id]) => addNote(ctx, leadId(id), await requireAdmin(ctx)))
on('DELETE', '/admin/leads/:id', async (ctx, [id]) => {
  await requireAdmin(ctx, ['super_admin'])
  const r = await db().query(`delete from leads where id = $1`, [leadId(id)])
  if (!r.rowCount) throw new HttpError(404, 'Lead not found.')
  return { ok: true }
})
function leadId(s: string) {
  const n = Number(s)
  if (!Number.isInteger(n) || n < 1) throw new HttpError(404, 'Lead not found.')
  return n
}

/* ---------- team (admins) ---------- */
on('GET', '/admin/team', async (ctx) => {
  const me = await requireAdmin(ctx)
  const full = me.role === 'super_admin'
  const { rows } = await db().query(
    `select id, name, email, role, active, created_at, last_login_at,
            (select count(*)::int from leads l where l.assigned_to = admins.id and l.status not in ('Converted','Lost')) as open_leads
     from admins order by active desc, name`,
  )
  return { team: full ? rows : rows.filter((r) => r.active).map(({ id, name, role }) => ({ id, name, role })) }
})
on('POST', '/admin/team', async (ctx) => {
  await requireAdmin(ctx, ['super_admin'])
  const b = await readJson(ctx.req)
  const email = String(b.email || '').trim().toLowerCase()
  const name = String(b.name || '').trim()
  const role = String(b.role || '') as Role
  if (!EMAIL_RE.test(email)) throw new HttpError(422, 'Enter a valid email.')
  if (name.length < 2) throw new HttpError(422, 'Enter a name.')
  if (!(role in ROLES)) throw new HttpError(422, 'Choose a role.')
  const pw = checkPasswordStrength(b.password)
  try {
    const { rows } = await db().query(
      `insert into admins(email, name, role, password_hash) values ($1,$2,$3,$4) returning id, email, name, role, active`,
      [email, name, role, await hashPassword(pw)],
    )
    return { admin: rows[0] }
  } catch (e) {
    if ((e as { code?: string }).code === '23505') throw new HttpError(409, 'An admin with this email already exists.')
    throw e
  }
})
on('PATCH', '/admin/team/:id', async (ctx, [id]) => {
  const me = await requireAdmin(ctx, ['super_admin'])
  const b = await readJson(ctx.req)
  if (id === me.id && (b.active === false || (b.role && b.role !== 'super_admin'))) {
    throw new HttpError(422, 'You cannot deactivate or demote your own account.')
  }
  const sets: string[] = []
  const params: unknown[] = []
  if (typeof b.active === 'boolean') { params.push(b.active); sets.push(`active = $${params.length}`) }
  if (typeof b.role === 'string') {
    if (!(b.role in ROLES)) throw new HttpError(422, 'Choose a role.')
    params.push(b.role); sets.push(`role = $${params.length}`)
  }
  if (typeof b.name === 'string' && b.name.trim().length >= 2) { params.push(b.name.trim()); sets.push(`name = $${params.length}`) }
  if (!sets.length) throw new HttpError(422, 'Nothing to update.')
  params.push(id)
  const r = await db().query(`update admins set ${sets.join(', ')} where id = $${params.length} returning id, name, email, role, active`, params)
  if (!r.rows[0]) throw new HttpError(404, 'Team member not found.')
  if (b.active === false) await db().query(`delete from admin_sessions where admin_id = $1`, [id])
  return { admin: r.rows[0] }
})

/* ---------- settings ---------- */
on('GET', '/admin/settings', async (ctx) => {
  await requireAdmin(ctx, MANAGERS)
  const { rows } = await db().query(`select value from settings where key = 'notifications'`)
  return { notifications: rows[0]?.value || { enabled: false, recipients: [] }, mailConfigured: mailConfigured(), mailFrom: process.env.MAIL_FROM || process.env.SMTP_USER || null }
})
on('PUT', '/admin/settings', async (ctx) => {
  await requireAdmin(ctx, ['super_admin'])
  const b = await readJson<{ notifications?: { enabled?: unknown; recipients?: unknown } }>(ctx.req)
  const n = b.notifications || {}
  const recipients = Array.isArray(n.recipients)
    ? [...new Set(n.recipients.map((r) => String(r).trim().toLowerCase()).filter(Boolean))]
    : []
  const bad = recipients.find((r) => !EMAIL_RE.test(r))
  if (bad) throw new HttpError(422, `"${bad}" is not a valid email.`)
  if (recipients.length > 10) throw new HttpError(422, 'Up to 10 recipients.')
  const value = { enabled: !!n.enabled, recipients }
  await db().query(
    `insert into settings(key, value, updated_at) values ('notifications', $1, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [JSON.stringify(value)],
  )
  return { notifications: value, mailConfigured: mailConfigured() }
})
on('POST', '/admin/settings/test-email', async (ctx) => {
  const admin = await requireAdmin(ctx, ['super_admin'])
  if (!mailConfigured()) throw new HttpError(422, 'Email is not configured on the server yet (SMTP settings).')
  await sendMail([admin.email], 'Parva IT admin: test email', 'Email notifications are working.')
  return { ok: true, sentTo: admin.email }
})

/* ---------- dispatcher ---------- */
export async function handle(req: Req, res: Res, path: string) {
  const url = new URL(req.url || '/', 'http://localhost')
  const ctx: Ctx = { req, res, method: (req.method || 'GET').toUpperCase(), path, query: url.searchParams, ip: clientIp(req) }
  try {
    const matchingPath = routes.filter(([, re]) => re.test(path))
    const route = matchingPath.find(([m]) => m === ctx.method)
    if (!route) {
      if (matchingPath.length) throw new HttpError(405, 'Method not allowed.')
      throw new HttpError(404, 'Not found.')
    }
    const params = (route[1].exec(path) || []).slice(1).map(decodeURIComponent)
    const result = await route[2](ctx, params)
    if (!res.writableEnded) sendJson(res, 200, result ?? { ok: true })
  } catch (e) {
    if (e instanceof HttpError) {
      sendJson(res, e.status, { error: e.message, fields: e.details })
    } else {
      console.error(`API error on ${ctx.method} ${path}`, e)
      sendJson(res, 500, { error: 'Something went wrong on our side. Please try again.' })
    }
  }
}
