// The four development projects shown under "Our Work".
// Every feature listed here was verified in the project's source code and in the running demo.
// The demos are browser-only: they use fictional sample data and save changes in the visitor's own browser.

export interface Project {
  id: 'crm' | 'hr' | 'pms' | 'realty'
  number: string
  short: string
  label: string
  title: string
  interest: string // value sent with "Discuss a similar project"
  statement: string
  overview: string
  problem: string
  solution: string
  features: string[]
  stack: string[]
  benefits: string[]
  demoUrl: string
  demoLogin: string
  facts: [string, string][] // factual counts taken from the source code
  modules: string[]
}

export const projects: Project[] = [
  {
    id: 'crm',
    number: '01',
    short: 'CRM',
    label: 'CRM & Business Management',
    title: 'Sales CRM with an 11-stage deal workflow',
    interest: 'CRM & Business Management',
    statement: 'Every lead, every follow-up, one pipeline.',
    overview:
      'A role-based CRM built for a real estate sales team that works across two offices. Executives, sales managers and a super admin each get their own menu and responsibilities.',
    problem:
      'Leads arrived from several channels and were tracked in spreadsheets and chat. Follow-ups were missed, hand-overs between offices were unclear, and managers had no reliable view of the pipeline.',
    solution:
      'One system that captures each lead, moves it through a defined 11-stage sales process, routes approvals up the hierarchy, balances workload across agents and gives managers live dashboards and reports.',
    features: [
      'Lead list with search, filters, bulk status change and CSV export',
      'Lead detail with 11-stage process, activity log, follow-ups and reassignment requests',
      'Drag-and-drop pipeline board and lead-source performance',
      'Approval chain: Executive → Sales Manager → Super Admin',
      'Workload view with capacity-based lead distribution',
      'Property inventory with projects, units and unit status',
      'Site visits, shared calendar, team chat and notifications',
      'Org chart, leave approvals, payroll sign-off and audit log',
      'Reports centre with CSV downloads, dark mode and settings',
    ],
    stack: ['React 18', 'Vite', 'JavaScript', 'Lucide icons'],
    benefits: [
      'Each role sees only the screens and actions it is responsible for',
      'Every change is recorded in an audit log',
      'Managers can see pipeline, workload and approvals in one place',
    ],
    demoUrl: '/demos/crm/',
    demoLogin: 'Pick any demo role on the sign-in screen. Sample data only.',
    facts: [
      ['3', 'User roles'],
      ['11', 'Sales stages'],
      ['21', 'Modules'],
    ],
    modules: ['Leads & pipeline', 'Approvals', 'Reports centre'],
  },
  {
    id: 'hr',
    number: '02',
    short: 'HR',
    label: 'HRMS & Employee Management',
    title: 'HR portal for five roles, from hiring to exit',
    interest: 'HRMS & Employee Management',
    statement: 'Every employee process, in one place.',
    overview:
      'A complete HR portal with separate workspaces for employees, line managers, HR, management and finance. Requests flow between roles automatically.',
    problem:
      'Leave, attendance, expenses, payroll approvals and employee documents were handled by email and spreadsheets, with no single record and no clear approval trail.',
    solution:
      'A self-service portal for employees and approval workspaces for managers, HR, the CEO and finance, so each request moves through the right people and HR keeps one source of truth.',
    features: [
      'Employee self-service: leave, clock in/out, expenses with receipts, tickets, documents and timesheets',
      'Leave balances and multi-level leave approval',
      'Attendance tracking and team timesheets',
      'Payroll processing with manager approval, finance sign-off and PDF payslips',
      'Recruitment with requisitions and candidates',
      'Employee directory and organisation chart',
      'Performance goals and reviews',
      'Onboarding, exit management and employee tickets',
      'Excel/CSV export, notifications, profile and password reset flow',
    ],
    stack: ['React 19', 'TypeScript', 'Tailwind CSS', 'Recharts', 'jsPDF', 'SheetJS'],
    benefits: [
      'Requests reach the right approver without email chains',
      'HR, management and finance each see what they need to act on',
      'Payslips are generated as PDFs from payroll records',
    ],
    demoUrl: '/demos/hr/',
    demoLogin: 'Choose a role on the sign-in screen; the demo account is pre-filled. Sample data only.',
    facts: [
      ['5', 'Role portals'],
      ['13', 'HR modules'],
      ['PDF', 'Payslips'],
    ],
    modules: ['Leave & attendance', 'Payroll', 'Recruitment'],
  },
  {
    id: 'pms',
    number: '03',
    short: 'PMS',
    label: 'Portfolio Management System',
    title: 'Investment portfolio administration with an investor portal',
    interest: 'Portfolio Management System',
    statement: 'Every investment, return and maturity in one place.',
    overview:
      'A super admin dashboard and an investor portal for monthly-return investment plans, with branches, lock-in periods, payouts, withdrawals and reporting.',
    problem:
      'Investor records, monthly returns, lock-in dates and payouts were difficult to track accurately by hand, and investors had no direct view of their own position.',
    solution:
      'A ledger-based system where the administrator records investments once and the platform calculates returns, tracks lock-ins and payouts, and gives each investor a secure view of their own portfolio.',
    features: [
      'Admin overview with branch-wise investors and principal',
      'Investor and investment records with KYC and account status',
      'Configurable monthly ROI and lock-in per investment',
      'Monthly accruals, payouts and withdrawal requests',
      'Introducer network with bonus split',
      'Branch management and investor ranking',
      'Investor portal: investments, returns, lock-in, statement and queries',
      'Announcements, brochures and document sharing',
      'Monthly summary and CSV reports, audit log and search',
    ],
    stack: ['React 18', 'TypeScript', 'React Router', 'Vite', 'Vitest'],
    benefits: [
      'Returns and payouts are calculated from recorded transactions',
      'Investors can check their own portfolio and raise queries',
      'Administrators can export portfolio, investor and payout registers',
    ],
    demoUrl: '/demos/pms/',
    demoLogin: 'Choose Super Admin or Investor; the demo account is pre-filled. Fictional data only.',
    facts: [
      ['2', 'Portals'],
      ['Any', 'Monthly ROI rate'],
      ['CSV', 'Reports'],
    ],
    modules: ['Investments & ROI', 'Payouts', 'Investor portal'],
  },
  {
    id: 'realty',
    number: '04',
    short: 'WEB',
    label: 'Website Design & Development',
    title: 'Real Estate Website & Digital Platform',
    interest: 'Real Estate Website & Digital Platform',
    statement: 'A property website that sells, informs and converts.',
    overview:
      'A responsive marketing website and digital platform for an international real estate business, with a searchable property catalogue, interactive map, investment tools and a content admin.',
    problem:
      'The business needed a premium online presence that could present a large property portfolio clearly, explain the investment case to overseas buyers and turn visitors into consultation requests.',
    solution:
      'A fast single-page website with a filterable property catalogue, map-based exploration, return calculator and guided content, connected to an admin panel for updating listings and reviewing owner requests.',
    features: [
      'Property catalogue with search, filters, sorting, watchlist and side-by-side compare',
      'Property detail view with gallery and key investment figures',
      'Interactive map that filters properties by area',
      'Return-on-investment calculator',
      'Consultation booking form with email delivery',
      'Owner sell/exchange requests with photo upload to a cloud database',
      'Knowledge hub with articles and a downloadable PDF investor guide',
      'Guided Q&A assistant and WhatsApp contact button',
      'Light/dark theme, responsive layout and an admin area for listings and owner requests',
    ],
    stack: ['React 19', 'TypeScript', 'Tailwind CSS', 'Vite', 'Leaflet', 'Supabase', 'React-PDF'],
    benefits: [
      'Owner requests and photos are stored in a cloud database for the team to review',
      'Visitors can filter, compare and shortlist properties themselves',
      'Inquiries and owner requests reach the team directly',
    ],
    demoUrl: '/demos/realty/',
    demoLogin: 'Anonymised demo with sample data. Admin panel: admin@demorealty.example / Demo@2026',
    facts: [
      ['12', 'Page sections'],
      ['Map', 'Area filter'],
      ['2', 'Themes'],
    ],
    modules: ['Property catalogue', 'Interactive map', 'ROI calculator'],
  },
]
