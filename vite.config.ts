import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sendEnquiry } from './lib/sendEnquiry.ts'

// Serves POST /api/enquiry under `vite dev`, reading keys from .env / .env.local
// (mirrors the Vercel function in production).
function enquiryApi(env: Record<string, string>): Plugin {
  return {
    name: 'enquiry-api',
    configureServer(server) {
      server.middlewares.use('/api/enquiry', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Allow', 'POST')
          return res.end(JSON.stringify({ error: 'Method not allowed' }))
        }
        try {
          const chunks: Buffer[] = []
          for await (const c of req) chunks.push(c as Buffer)
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
          const { status, body: out } = await sendEnquiry(body, env)
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(out))
        } catch {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Unexpected error' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), enquiryApi(env)],
    server: {
      allowedHosts: ['*.ngrok-free.app'],
    },
  }
})
