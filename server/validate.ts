// Server-side validation for the public inquiry form. The browser runs the same rules
// (src/lib/inquiry.ts) for instant feedback, but this is the source of truth.
import { HttpError } from './core'
import { INDUSTRIES, REQUIREMENTS, BUDGETS, PROJECT_INTERESTS, LEAD_STATUSES } from '../src/lib/options'

export interface InquiryInput {
  fullName: string
  company: string
  email: string
  phone: string
  industry: string
  requirement: string
  description: string
  budget: string
  projectInterest: string
  source: string
  idempotencyKey: string
  website: string // honeypot: real visitors never fill this in
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^\+?[0-9][0-9\s\-()]{6,19}$/

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export function validateInquiry(body: Record<string, unknown>): InquiryInput {
  const input: InquiryInput = {
    fullName: str(body.fullName, 120),
    company: str(body.company, 160),
    email: str(body.email, 200).toLowerCase(),
    phone: str(body.phone, 30),
    industry: str(body.industry, 80),
    requirement: str(body.requirement, 80),
    description: str(body.description, 5000),
    budget: str(body.budget, 60),
    projectInterest: str(body.projectInterest, 80),
    source: str(body.source, 80),
    idempotencyKey: str(body.idempotencyKey, 80),
    website: str(body.website, 200),
  }
  const errors: Record<string, string> = {}
  if (input.fullName.length < 2) errors.fullName = 'Please enter your full name.'
  if (!input.company) errors.company = 'Please enter your company name.'
  if (!EMAIL_RE.test(input.email)) errors.email = 'Please enter a valid business email.'
  if (!PHONE_RE.test(input.phone)) errors.phone = 'Please enter a valid phone number, including country code.'
  if (!INDUSTRIES.includes(input.industry)) errors.industry = 'Please choose your industry.'
  if (!REQUIREMENTS.includes(input.requirement)) errors.requirement = 'Please choose the type of requirement.'
  if (input.description.length < 20) errors.description = 'Please describe your project in at least 20 characters.'
  if (input.budget && !BUDGETS.includes(input.budget)) errors.budget = 'Please choose a budget range from the list.'
  if (input.projectInterest && !PROJECT_INTERESTS.includes(input.projectInterest)) input.projectInterest = ''
  if (Object.keys(errors).length) throw new HttpError(422, 'Please correct the highlighted fields.', errors)
  return input
}

export function validStatus(s: unknown): s is string {
  return typeof s === 'string' && (LEAD_STATUSES as readonly string[]).includes(s)
}

export function validDate(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s))
}

export { EMAIL_RE }
