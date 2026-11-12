// There is no public sign-up. The first Super Admin is created from the command line:
//   npm run admin:create -- --email you@parvait.com --name "Your Name" [--role super_admin]
// The password is read from the ADMIN_PASSWORD env var, or asked for interactively.
import readline from 'node:readline/promises'
import { loadEnv } from '../server/env'
import { db } from '../server/core'
import { hashPassword, checkPasswordStrength } from '../server/auth'
import { ROLES } from '../src/lib/options'

loadEnv()
const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : undefined
}
const email = arg('email')?.trim().toLowerCase()
const name = arg('name')?.trim()
const role = arg('role') || 'super_admin'
if (!email || !name || !(role in ROLES)) {
  console.error('Usage: npm run admin:create -- --email you@company.com --name "Full Name" [--role super_admin|manager|executive]')
  process.exit(1)
}
let password = process.env.ADMIN_PASSWORD
if (!password) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  password = await rl.question('Password (min 10 characters, letters and numbers): ')
  rl.close()
}
checkPasswordStrength(password)
await db().query(
  `insert into admins(email, name, role, password_hash) values ($1,$2,$3,$4)
   on conflict (email) do update set name = excluded.name, role = excluded.role, password_hash = excluded.password_hash, active = true`,
  [email, name, role, await hashPassword(password)],
)
console.log(`Admin ready: ${email} (${ROLES[role as keyof typeof ROLES]})`)
await db().end()
