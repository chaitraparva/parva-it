// Integration tests against a running API (npm run dev:api). Skipped when it is not running.
// Set API_BASE to point somewhere other than http://localhost:3001.
import { test } from 'node:test'
import assert from 'node:assert/strict'

const BASE = (process.env.API_BASE || 'http://localhost:3001') + '/api'
const up = await fetch(BASE + '/health').then((r) => r.ok).catch(() => false)

test('health check', { skip: !up && 'API not running' }, async () => {
  const r = await fetch(BASE + '/health')
  assert.equal(r.status, 200)
})

test('invalid inquiry returns 422 with field errors', { skip: !up && 'API not running' }, async () => {
  const r = await fetch(BASE + '/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'x' }) })
  assert.equal(r.status, 422)
  const j = await r.json()
  assert.ok(j.fields?.email)
})

test('admin data needs a session', { skip: !up && 'API not running' }, async () => {
  const r = await fetch(BASE + '/admin/leads')
  assert.equal(r.status, 401)
})

test('there is no public registration route', { skip: !up && 'API not running' }, async () => {
  const r = await fetch(BASE + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
  assert.equal(r.status, 404)
})
