// Outgoing email through the official Parva IT business mailbox (SMTP settings in env vars).
import nodemailer from 'nodemailer'

export const mailConfigured = () => !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

let transport: nodemailer.Transporter | null = null
function getTransport() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT || 587)
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  }
  return transport
}

export async function sendMail(to: string[], subject: string, text: string, html?: string) {
  if (!mailConfigured() || to.length === 0) return false
  await getTransport().sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: to.join(', '),
    subject,
    text,
    html,
  })
  return true
}

export const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export function siteUrl() {
  return (process.env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173')).replace(/\/$/, '')
}
