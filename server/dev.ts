// Local API server for development (`npm run dev` starts it next to Vite, which proxies /api here).
// It can also serve the built site (`npm run build && npm start`) for a production-like run.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { loadEnv } from './env'
import { handle } from './router'

loadEnv()
const port = Number(process.env.API_PORT || 3001)
const dist = path.resolve(process.cwd(), 'dist')
const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.txt': 'text/plain',
}

http
  .createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname)
    if (pathname.startsWith('/api/') || pathname === '/api') return void handle(req, res, pathname.replace(/^\/api/, '') || '/')
    if (!fs.existsSync(dist)) {
      res.statusCode = 404
      return res.end('API server. Run `npm run build` to also serve the site from here.')
    }
    // Static files, with the same single-page-app fallbacks as vercel.json.
    let file = path.join(dist, pathname)
    if (!file.startsWith(dist)) { res.statusCode = 400; return res.end() }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
    if (!fs.existsSync(file)) {
      const demo = pathname.match(/^\/demos\/([\w-]+)\//)
      file = demo && !path.extname(pathname) ? path.join(dist, 'demos', demo[1], 'index.html') : path.join(dist, 'index.html')
    }
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream')
    fs.createReadStream(file).pipe(res)
  })
  .listen(port, () => console.log(`Parva IT API listening on http://localhost:${port}`))
