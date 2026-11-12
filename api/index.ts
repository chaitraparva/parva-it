// Vercel serverless entry: every /api/* request is handled by server/router.ts.
// vercel.json rewrites /api/<anything> to /api?__route=<anything>, because Vercel's
// file-based catch-all only matches a single path segment outside Next.js.
import type { IncomingMessage, ServerResponse } from 'node:http'
import { handle } from '../server/router.js'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || '/', 'http://localhost')
  const route = url.searchParams.get('__route')
  const path = route != null ? '/' + route.replace(/^\/+/, '') : url.pathname.replace(/^\/api/, '') || '/'
  await handle(req, res, path === '/' ? '/' : path.replace(/\/+$/, ''))
}
