// Shared server helpers: database pool, request/response helpers, hashing.
import pg from 'pg'
import crypto from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'

// Return DATE columns as plain 'YYYY-MM-DD' strings (no timezone shifting).
pg.types.setTypeParser(1082, (v: string) => v)

let pool: pg.Pool | null = null
export function db(): pg.Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL
    if (!url) throw new HttpError(500, 'Server is not configured: DATABASE_URL is missing.')
    const needsSsl = process.env.DATABASE_SSL === 'true' || /supabase\.(co|com)|sslmode=require/.test(url)
    pool = new pg.Pool({
      connectionString: url,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
      max: Number(process.env.DATABASE_POOL_MAX || 5),
    })
  }
  return pool
}

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: Record<string, string>) {
    super(message)
  }
}

export type Req = IncomingMessage & { body?: unknown; query?: Record<string, string | string[]> }
export type Res = ServerResponse

export interface Ctx {
  req: Req
  res: Res
  method: string
  path: string // path after /api, e.g. "/admin/leads/12"
  query: URLSearchParams
  ip: string
}

export function sendJson(res: Res, status: number, data: unknown, headers: Record<string, string> = {}) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v)
  res.end(JSON.stringify(data))
}

const MAX_BODY = 64 * 1024
export async function readJson<T = Record<string, unknown>>(req: Req): Promise<T> {
  // Vercel parses JSON bodies for us; the local dev server does not.
  if (req.body !== undefined && req.body !== null && typeof req.body === 'object') return req.body as T
  if (typeof req.body === 'string') return parse<T>(req.body)
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY) throw new HttpError(413, 'Request is too large.')
    chunks.push(chunk as Buffer)
  }
  return parse<T>(Buffer.concat(chunks).toString('utf8') || '{}')
}
function parse<T>(s: string): T {
  try {
    return JSON.parse(s) as T
  } catch {
    throw new HttpError(400, 'Invalid JSON body.')
  }
}

export function parseCookies(req: Req): Record<string, string> {
  const out: Record<string, string> = {}
  const header = req.headers.cookie
  if (!header) return out
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

export function clientIp(req: Req): string {
  const fwd = req.headers['x-forwarded-for']
  const first = Array.isArray(fwd) ? fwd[0] : fwd?.split(',')[0]
  return (first || req.socket?.remoteAddress || 'unknown').trim()
}

export const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex')
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url')
export function ipHash(ip: string) {
  return sha256(`${process.env.SESSION_SECRET || 'parva-it'}:${ip}`)
}

export const isProd = () => process.env.NODE_ENV === 'production' || !!process.env.VERCEL
