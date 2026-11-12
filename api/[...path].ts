// Vercel serverless entry: every /api/* request is handled by server/router.ts.
import type { IncomingMessage, ServerResponse } from 'node:http'
import { handle } from '../server/router'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const path = new URL(req.url || '/', 'http://localhost').pathname.replace(/^\/api/, '') || '/'
  await handle(req, res, path)
}
