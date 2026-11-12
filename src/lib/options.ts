// Option lists shared by the public form, the admin portal and server-side validation.

export const INDUSTRIES = [
  'Real Estate',
  'Financial Management',
  'Corporate / Professional Services',
  'HR & Recruitment',
  'Retail & Sales',
  'Startup',
  'SME',
  'Enterprise',
  'Other',
]

export const REQUIREMENTS = [
  'Business Website',
  'Custom Software / Web Application',
  'CRM System',
  'HRMS System',
  'Portfolio / Management Dashboard',
  'ERP / Enterprise Application',
  'API & System Integration',
  'UI/UX Design',
  'Maintenance & Support',
  'Request a Demo',
  'Other',
]

export const BUDGETS = [
  'Under ₹5 Lakh',
  '₹5 – 15 Lakh',
  '₹15 – 40 Lakh',
  'Above ₹40 Lakh',
  'Not sure yet',
]

// Portfolio projects a visitor can arrive from ("Discuss a similar project").
export const PROJECT_INTERESTS = [
  'CRM & Business Management',
  'HRMS & Employee Management',
  'Portfolio Management System',
  'Real Estate Website & Digital Platform',
]

export const LEAD_STATUSES = [
  'New',
  'Contacted',
  'Interested',
  'Meeting Scheduled',
  'Proposal Sent',
  'Negotiation',
  'Converted',
  'Lost',
] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]

// "Qualified" on the dashboard = a lead that has shown real interest and is still open.
export const QUALIFIED_STATUSES: LeadStatus[] = ['Interested', 'Meeting Scheduled', 'Proposal Sent', 'Negotiation']

export const LEAD_SOURCES = [
  'Website contact form',
  'Portfolio – Discuss similar project',
  'Live demo page',
  'Referral',
  'Phone',
  'Email',
  'Other',
]

export const ROLES = {
  super_admin: 'Super Admin',
  manager: 'Sales Manager',
  executive: 'Sales Executive',
} as const
export type Role = keyof typeof ROLES
