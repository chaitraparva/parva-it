<<<<<<< HEAD
# Parva IT website and lead admin

The public Parva IT website, the inquiry form, and the admin portal for managing leads.

- **Public site:** React 19 + Vite + Tailwind (the existing Figma Make project, kept as-is where possible).
- **API:** TypeScript serverless functions in `api/` (Vercel), code in `server/`.
- **Database:** PostgreSQL (Supabase works out of the box). Schema in `db/schema.sql`.
- **Admin portal:** `/admin` (login at `/admin/login`). There is no public sign-up.
- **Portfolio demos:** `public/demos/{crm,hr,pms,realty}` are static builds served at `/demos/<name>/`. They run entirely in the visitor's browser with sample data and have no backend.

## 1. Set up the database

1. Create a Supabase project (or any Postgres 14+ database).
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL` and `SESSION_SECRET`.
3. Install and create the tables:

   ```bash
   npm install
   npm run db:migrate
   ```

   The schema enables Row Level Security with no policies on every table, so the Supabase public API cannot read them. Only the server (with the database password) can.

4. Create the first Super Admin. You will be asked for a password (at least 10 characters with letters and numbers):

   ```bash
   npm run admin:create -- --email you@your-domain.com --name "Your Name"
   ```

   Add `--role manager` or `--role executive` for other roles, or add people later from **Admin → Team**.

## 2. Run locally

```bash
npm run dev        # API on :3001 and the site on :8443 (Vite proxies /api)
npm test           # unit tests; API tests also run when the API is up
npm run typecheck
```

In development, the password-reset link is printed in the API terminal instead of being emailed if SMTP is not set.

## 3. Email notifications

Set the `SMTP_*` and `MAIL_FROM` variables to the official business mailbox (for Google Workspace or Microsoft 365, use an app password). Then, in **Admin → Settings**, a Super Admin switches on "Send an email for every new inquiry", adds recipients, and sends a test email. If email fails, the inquiry is still saved.

## 4. Deploy on Vercel

1. Push this folder to a Git repository and import it in Vercel (framework: Vite).
2. Add all variables from `.env.example` in Vercel → Settings → Environment Variables. Set `SITE_URL` to the live domain.
3. Deploy. `vercel.json` routes `/api/*` to the serverless API, serves the demos, adds security headers, and keeps `/admin` out of search engines.
4. **Before launch:** `.figma/make/site.json` still has `"robots": { "index": false }`, which tells search engines not to index the site. Change it to `true` when the site goes live.

## Roles

| Role | Can do |
|---|---|
| Super Admin | Everything: team, settings, delete leads, export |
| Sales Manager | All leads, assign to anyone, CSV export, view settings |
| Sales Executive | All leads, assign to themselves, notes and status updates, no export |

## Lead statuses

New, Contacted, Interested, Meeting Scheduled, Proposal Sent, Negotiation, Converted, Lost. The dashboard's "Qualified" count is Interested + Meeting Scheduled + Proposal Sent + Negotiation.

## Security notes

- Passwords are hashed with bcrypt. Sessions are random tokens stored hashed, sent as an httpOnly, SameSite=Strict, Secure cookie.
- Admin write requests require a custom header (CSRF protection). Login is rate limited (5 failures per 15 minutes).
- The inquiry form has server-side validation, a hidden spam field, a per-IP rate limit, and duplicate protection (double-click and repeat submissions within 10 minutes).
- CSV exports are protected against spreadsheet formula injection.
- All secrets are read from environment variables. Nothing sensitive is stored in the browser.

## Package manager

Dependencies were installed with npm (`package-lock.json`). `pnpm-lock.yaml` from the original project has not been updated; delete it or run `pnpm install` if you prefer pnpm.
=======
# parva-it
website
>>>>>>> 9a6e006645b804f9a65b52d081ef1380a1fb426d
