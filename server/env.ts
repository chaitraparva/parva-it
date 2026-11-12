// Minimal .env loader for local scripts (Vercel injects env vars itself).
import fs from 'node:fs'
import path from 'node:path'

export function loadEnv(file = '.env') {
  const p = path.resolve(process.cwd(), file)
  if (!fs.existsSync(p)) return
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m || line.trim().startsWith('#')) continue
    const v = m[2].replace(/^(['"])(.*)\1$/, '$2')
    if (process.env[m[1]] === undefined) process.env[m[1]] = v
  }
}
