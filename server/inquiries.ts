// Public inquiry form → lead. Server-side validation, honeypot, per-IP rate limit and
// duplicate protection (idempotency key + same content within 10 minutes).
import { db, HttpError, ipHash, readJson, sha256, type Ctx } from './core'
import { validateInquiry } from './validate'
import { sendMail, esc, siteUrl } from './mail'

const RATE_LIMIT = Number(process.env.INQUIRY_RATE_LIMIT || 5) // per IP per 10 minutes

export async function createInquiry(ctx: Ctx) {
  const body = await readJson(ctx.req)
  const input = validateInquiry(body)

  // Honeypot filled → bot. Pretend success and store nothing.
  if (input.website) return { ok: true, leadCode: null }

  const ipH = ipHash(ctx.ip)
  const contentHash = sha256([input.email, input.phone, input.requirement, input.description.toLowerCase()].join('|'))

  if (input.idempotencyKey) {
    const same = await db().query(`select lead_code from leads where idempotency_key = $1`, [input.idempotencyKey])
    if (same.rows[0]) return { ok: true, leadCode: same.rows[0].lead_code, duplicate: true }
  }
  const dupe = await db().query(
    `select lead_code from leads where content_hash = $1 and created_at > now() - interval '10 minutes' limit 1`,
    [contentHash],
  )
  if (dupe.rows[0]) return { ok: true, leadCode: dupe.rows[0].lead_code, duplicate: true }

  const rate = await db().query(
    `select count(*)::int as n from leads where ip_hash = $1 and created_at > now() - interval '10 minutes'`,
    [ipH],
  )
  if (rate.rows[0].n >= RATE_LIMIT) {
    throw new HttpError(429, 'We have received several requests from your connection. Please try again in a few minutes.')
  }

  const isDemo = input.requirement === 'Request a Demo'
  const source = input.source || (input.projectInterest ? 'Portfolio – Discuss similar project' : 'Website contact form')
  let lead
  try {
    const { rows } = await db().query(
      `insert into leads (full_name, company, email, phone, industry, service, project_interest, description, budget,
                          source, is_demo_request, idempotency_key, content_hash, ip_hash, assigned_to)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
               -- Every new inquiry goes to the lead owner: LEAD_OWNER_EMAIL if set, otherwise the first Super Admin.
               (select id from admins where active and (lower(email) = lower($15) or ($15 = '' and role = 'super_admin'))
                order by created_at limit 1))
       returning id, lead_code, created_at`,
      [
        input.fullName, input.company, input.email, input.phone, input.industry, input.requirement,
        input.projectInterest || null, input.description, input.budget || null, source.slice(0, 80), isDemo,
        input.idempotencyKey || null, contentHash, ipH, (process.env.LEAD_OWNER_EMAIL || '').trim(),
      ],
    )
    lead = rows[0]
  } catch (e: unknown) {
    // Two identical submissions racing each other: return the one that won.
    if ((e as { code?: string }).code === '23505' && input.idempotencyKey) {
      const same = await db().query(`select lead_code from leads where idempotency_key = $1`, [input.idempotencyKey])
      if (same.rows[0]) return { ok: true, leadCode: same.rows[0].lead_code, duplicate: true }
    }
    throw e
  }
  await db().query(`insert into lead_history(lead_id, action, new_value) values ($1, 'Lead created', $2)`, [lead.id, source])

  // Email alert to the team, if switched on in Admin → Settings. A mail failure never loses the lead.
  try {
    const s = await db().query(`select value from settings where key = 'notifications'`)
    const cfg = s.rows[0]?.value as { enabled?: boolean; recipients?: string[] } | undefined
    if (cfg?.enabled && cfg.recipients?.length) {
      const rows: [string, string][] = [
        ['Lead ID', lead.lead_code], ['Name', input.fullName], ['Company', input.company], ['Email', input.email],
        ['Phone', input.phone], ['Industry', input.industry], ['Requirement', input.requirement],
        ['Project interest', input.projectInterest || '—'], ['Budget', input.budget || '—'], ['Source', source],
      ]
      const link = `${siteUrl()}/admin/leads/${lead.id}`
      await sendMail(
        cfg.recipients,
        `New inquiry ${lead.lead_code}: ${input.requirement} – ${input.company}`,
        rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\n${input.description}\n\nOpen in admin: ${link}`,
        `<h2 style="font-family:Georgia,serif">New website inquiry</h2><table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">` +
          rows.map(([k, v]) => `<tr><td style="color:#777">${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`).join('') +
          `</table><p style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap">${esc(input.description)}</p>` +
          `<p><a href="${esc(link)}">Open in Parva IT admin</a></p>`,
      )
    }
  } catch (e) {
    console.error('Inquiry notification email failed', e)
  }

  return { ok: true, leadCode: lead.lead_code }
}
