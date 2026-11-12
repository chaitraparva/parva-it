// Creates or updates the database tables: `npm run db:migrate`
import fs from 'node:fs'
import path from 'node:path'
import { loadEnv } from '../server/env'
import { db } from '../server/core'

loadEnv()
const sql = fs.readFileSync(path.resolve(process.cwd(), 'db/schema.sql'), 'utf8')
await db().query(sql)
console.log('Database schema is up to date.')
await db().end()
