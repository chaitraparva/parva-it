// Admin authentication: bcrypt passwords, opaque session tokens in an httpOnly cookie,
// sessions stored hashed in the database, login rate limiting and role checks.
import bcrypt from 'bcryptjs'
import { db, HttpError, parseCookies, randomToken, sha256, isProd, type Ctx } from './core.js'
import type { Role } from '../src/lib/options.js'

export const SESSION_COOKIE = 'pit_admin_session'
const SESSION_HOURS = Number(process.env.SESSION_HOURS || 12)
const MAX_FAILED = 5 // per email per 15 minutes
let dummyHash: string | null = null
const getDummyHash = () => (dummyHash ||= bcrypt.hashSync('not-a-real-password', 12))

export interface Admin {
  id: string
  email: string
  name: string
  role: Role
}

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12)

export function checkPasswordStrength(pw: unknown): string {
  if (typeof pw !== 'string' || pw.length < 10) throw new HttpError(422, 'Password must be at least 10 characters.')
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) throw new HttpError(422, 'Password must contain letters and numbers.')
  if (pw.length > 200) throw new HttpError(422, 'Password is too long.')
  return pw
}

function cookie(value: string, maxAgeSeconds: number) {
  const parts = [`${SESSION_COOKIE}=${value}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${maxAgeSeconds}`]
  if (isProd()) parts.push('Secure')
  return parts.join('; ')
}

export async function login(ctx: Ctx, emailRaw: unknown, password: unknown) {
  const email = typeof emailRaw === 'string' ? emailRaw.trim().toLowerCase() : ''
  if (!email || typeof password !== 'string' || !password) throw new HttpError(400, 'Enter your email and password.')

  const recent = await db().query(
    `select count(*)::int as n from login_attempts where email = $1 and success = false and created_at > now() - interval '15 minutes'`,
    [email],
  )
  if (recent.rows[0].n >= MAX_FAILED) throw new HttpError(429, 'Too many failed attempts. Please wait 15 minutes and try again.')

  const { rows } = await db().query(`select id, email, name, role, password_hash, active from admins where email = $1`, [email])
  const row = rows[0]
  // Compare against a dummy hash when the account does not exist, so timing does not reveal valid emails.
  const ok = await bcrypt.compare(password, row?.password_hash || getDummyHash())
  const success = !!row && row.active && ok
  await db().query(`insert into login_attempts(email, ip_hash, success) values ($1, $2, $3)`, [email, sha256(ctx.ip), success])
  if (!success) throw new HttpError(401, 'Incorrect email or password.')

  const token = randomToken()
  await db().query(
    `insert into admin_sessions(token_hash, admin_id, expires_at, user_agent) values ($1, $2, now() + ($3 || ' hours')::interval, $4)`,
    [sha256(token), row.id, String(SESSION_HOURS), String(ctx.req.headers['user-agent'] || '').slice(0, 300)],
  )
  await db().query(`update admins set last_login_at = now() where id = $1`, [row.id])
  await db().query(`delete from admin_sessions where expires_at < now()`)
  ctx.res.setHeader('Set-Cookie', cookie(token, SESSION_HOURS * 3600))
  return { id: row.id, email: row.email, name: row.name, role: row.role } as Admin
}

export async function logout(ctx: Ctx) {
  const token = parseCookies(ctx.req)[SESSION_COOKIE]
  if (token) await db().query(`delete from admin_sessions where token_hash = $1`, [sha256(token)])
  ctx.res.setHeader('Set-Cookie', cookie('', 0))
}

export async function currentAdmin(ctx: Ctx): Promise<Admin | null> {
  const token = parseCookies(ctx.req)[SESSION_COOKIE]
  if (!token) return null
  const { rows } = await db().query(
    `select a.id, a.email, a.name, a.role from admin_sessions s join admins a on a.id = s.admin_id
     where s.token_hash = $1 and s.expires_at > now() and a.active`,
    [sha256(token)],
  )
  return (rows[0] as Admin) || null
}

export async function requireAdmin(ctx: Ctx, roles?: Role[]): Promise<Admin> {
  const admin = await currentAdmin(ctx)
  if (!admin) throw new HttpError(401, 'Please sign in.')
  if (roles && !roles.includes(admin.role)) throw new HttpError(403, 'Your role does not have access to this.')
  // Protect state-changing requests against cross-site submission.
  if (ctx.method !== 'GET' && ctx.req.headers['x-requested-with'] !== 'parva-admin') {
    throw new HttpError(403, 'Request rejected.')
  }
  return admin
}

/** Creates a reset token. Always resolves, so the response never reveals whether the email exists. */
export async function createPasswordReset(emailRaw: unknown): Promise<{ admin: Admin; token: string } | null> {
  const email = typeof emailRaw === 'string' ? emailRaw.trim().toLowerCase() : ''
  if (!email) return null
  const { rows } = await db().query(`select id, email, name, role from admins where email = $1 and active`, [email])
  if (!rows[0]) return null
  const recent = await db().query(
    `select count(*)::int as n from password_resets where admin_id = $1 and created_at > now() - interval '15 minutes'`,
    [rows[0].id],
  )
  if (recent.rows[0].n >= 3) return null
  const token = randomToken()
  await db().query(
    `insert into password_resets(token_hash, admin_id, expires_at) values ($1, $2, now() + interval '1 hour')`,
    [sha256(token), rows[0].id],
  )
  return { admin: rows[0] as Admin, token }
}

export async function resetPassword(token: unknown, password: unknown) {
  if (typeof token !== 'string' || !token) throw new HttpError(400, 'This reset link is invalid.')
  const pw = checkPasswordStrength(password)
  const client = await db().connect()
  try {
    await client.query('begin')
    const { rows } = await client.query(
      `select admin_id from password_resets where token_hash = $1 and used_at is null and expires_at > now() for update`,
      [sha256(token)],
    )
    if (!rows[0]) throw new HttpError(400, 'This reset link has expired or was already used. Please request a new one.')
    await client.query(`update admins set password_hash = $1 where id = $2`, [await hashPassword(pw), rows[0].admin_id])
    await client.query(`update password_resets set used_at = now() where token_hash = $1`, [sha256(token)])
    await client.query(`delete from admin_sessions where admin_id = $1`, [rows[0].admin_id]) // sign out everywhere
    await client.query('commit')
  } catch (e) {
    await client.query('rollback')
    throw e
  } finally {
    client.release()
  }
}
