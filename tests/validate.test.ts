// Unit tests for the server-side inquiry rules. Run with: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateInquiry } from '../server/validate'
import { HttpError } from '../server/core'

const good = {
  fullName: 'Test Person',
  company: 'Example Co',
  email: 'test@example.com',
  phone: '+971 50 123 4567',
  industry: 'Real Estate',
  requirement: 'CRM System',
  description: 'We need a system to track our customer requests and follow-ups.',
}

test('accepts a complete inquiry', () => {
  const r = validateInquiry(good)
  assert.equal(r.email, 'test@example.com')
  assert.equal(r.fullName, 'Test Person')
})

test('rejects missing and malformed fields with per-field errors', () => {
  try {
    validateInquiry({ ...good, email: 'not-an-email', phone: 'abc', fullName: '' })
    assert.fail('should have thrown')
  } catch (e) {
    assert.ok(e instanceof HttpError)
    assert.equal(e.status, 422)
    const d = e.details as Record<string, string>
    assert.ok(d.email && d.phone && d.fullName)
  }
})

test('rejects values outside the allowed option lists', () => {
  assert.throws(() => validateInquiry({ ...good, industry: 'Something else' }), HttpError)
})
