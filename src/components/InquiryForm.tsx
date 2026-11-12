import { FormEvent, useMemo, useState } from 'react'
import { INDUSTRIES, REQUIREMENTS, BUDGETS } from '../lib/options'

export interface InquiryPreset {
  requirement?: string
  projectInterest?: string
  source?: string
}

type Fields = {
  fullName: string
  company: string
  email: string
  phone: string
  industry: string
  requirement: string
  description: string
  budget: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^\+?[0-9][0-9\s\-()]{6,19}$/

function validate(f: Fields) {
  const e: Partial<Record<keyof Fields, string>> = {}
  if (f.fullName.trim().length < 2) e.fullName = 'Please enter your full name.'
  if (!f.company.trim()) e.company = 'Please enter your company name.'
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Please enter a valid business email.'
  if (!PHONE_RE.test(f.phone.trim())) e.phone = 'Please enter a valid phone number, including country code.'
  if (!f.industry) e.industry = 'Please choose your industry.'
  if (!f.requirement) e.requirement = 'Please choose the type of requirement.'
  if (f.description.trim().length < 20) e.description = 'Please describe your project in at least 20 characters.'
  return e
}

const newKey = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)

/** The inquiry form used in the Contact section and in the "Discuss your project" pop-up. */
export default function InquiryForm({
  preset,
  onDone,
  idPrefix,
}: {
  preset?: InquiryPreset
  onDone?: () => void
  idPrefix: string
}) {
  const [fields, setFields] = useState<Fields>({
    fullName: '',
    company: '',
    email: '',
    phone: '',
    industry: '',
    requirement: preset?.requirement || '',
    description: '',
    budget: '',
  })
  const [honeypot, setHoneypot] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({})
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [leadCode, setLeadCode] = useState<string | null>(null)
  // One key per form fill: a double click or a retry after a network blip cannot create two leads.
  const idempotencyKey = useMemo(newKey, [])

  const set = (k: keyof Fields) => (e: { target: { value: string } }) => {
    setFields((f) => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (state === 'sending') return
    const found = validate(fields)
    setErrors(found)
    if (Object.keys(found).length) {
      setMessage('Please correct the highlighted fields.')
      document.getElementById(`${idPrefix}-${Object.keys(found)[0]}`)?.focus()
      return
    }
    setState('sending')
    setMessage('')
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...fields,
          projectInterest: preset?.projectInterest || '',
          source: preset?.source || '',
          idempotencyKey,
          website: honeypot,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data.fields) setErrors(data.fields)
        throw new Error(data.error || 'We could not send your request. Please try again.')
      }
      setLeadCode(data.leadCode || null)
      setState('done')
    } catch (e) {
      setState('error')
      setMessage(
        e instanceof TypeError
          ? 'We could not reach our server. Please check your connection and try again.'
          : (e as Error).message,
      )
    }
  }

  if (state === 'done') {
    return (
      <div className="success-state" role="status">
        <div>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="m5 12 4 4L19 6" />
          </svg>
        </div>
        <p className="section-label gold">REQUEST RECEIVED</p>
        <h2>Thank you, {fields.fullName.split(' ')[0]}.</h2>
        <p>
          Your requirement has reached the Parva IT team{leadCode ? ` (reference ${leadCode})` : ''}. We will
          review it and contact you at {fields.email} to understand your needs in more detail.
        </p>
        {onDone && (
          <button className="gold-button" type="button" onClick={onDone}>
            Return to the site
          </button>
        )}
      </div>
    )
  }

  const field = (k: keyof Fields) => ({
    id: `${idPrefix}-${k}`,
    value: fields[k],
    onChange: set(k),
    'aria-invalid': !!errors[k] || undefined,
    'aria-describedby': errors[k] ? `${idPrefix}-${k}-err` : undefined,
  })
  const err = (k: keyof Fields) =>
    errors[k] ? (
      <span className="field-error" id={`${idPrefix}-${k}-err`}>
        {errors[k]}
      </span>
    ) : null

  return (
    <form onSubmit={submit} noValidate className="inquiry-form">
      <div className="form-row">
        <label htmlFor={`${idPrefix}-fullName`}>
          FULL NAME *
          <input {...field('fullName')} autoComplete="name" placeholder="Your full name" maxLength={120} />
          {err('fullName')}
        </label>
        <label htmlFor={`${idPrefix}-company`}>
          COMPANY NAME *
          <input {...field('company')} autoComplete="organization" placeholder="Company or organisation" maxLength={160} />
          {err('company')}
        </label>
      </div>
      <div className="form-row">
        <label htmlFor={`${idPrefix}-email`}>
          BUSINESS EMAIL *
          <input {...field('email')} type="email" autoComplete="email" placeholder="you@company.com" maxLength={200} />
          {err('email')}
        </label>
        <label htmlFor={`${idPrefix}-phone`}>
          PHONE NUMBER *
          <input {...field('phone')} type="tel" autoComplete="tel" placeholder="+91 98765 43210" maxLength={30} />
          {err('phone')}
        </label>
      </div>
      <div className="form-row">
        <label htmlFor={`${idPrefix}-industry`}>
          INDUSTRY *
          <select {...field('industry')}>
            <option value="">Select your industry</option>
            {INDUSTRIES.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          {err('industry')}
        </label>
        <label htmlFor={`${idPrefix}-requirement`}>
          TYPE OF REQUIREMENT *
          <select {...field('requirement')}>
            <option value="">Select a requirement</option>
            {REQUIREMENTS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          {err('requirement')}
        </label>
      </div>
      <label htmlFor={`${idPrefix}-description`}>
        PROJECT DESCRIPTION *
        <textarea
          {...field('description')}
          rows={4}
          maxLength={5000}
          placeholder="Tell us about your business, the problem you want to solve and what you have in mind. A simple explanation is perfect."
        />
        {err('description')}
      </label>
      <label htmlFor={`${idPrefix}-budget`}>
        ESTIMATED BUDGET (OPTIONAL)
        <select {...field('budget')}>
          <option value="">Prefer not to say</option>
          {BUDGETS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </label>
      {/* Hidden from people; bots that fill every field are ignored by the server. */}
      <div className="hp-field" aria-hidden="true">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </label>
      </div>
      {preset?.projectInterest && (
        <p className="form-context">
          Regarding: <b>{preset.projectInterest}</b>
        </p>
      )}
      {message && (
        <p className={`form-message ${state === 'error' ? 'is-error' : ''}`} role="alert">
          {message}
        </p>
      )}
      <button className="gold-button" type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Send my requirement'}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <path d="M5 12h14m-5-5 5 5-5 5" />
        </svg>
      </button>
      <small>Your details are used only to respond to this inquiry.</small>
    </form>
  )
}
