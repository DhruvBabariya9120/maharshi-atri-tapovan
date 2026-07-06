import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendEnquiry } from '../lib/sendEnquiry'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const body = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) ?? {}
  const { status, body: out } = await sendEnquiry(body, process.env)
  return res.status(status).json(out)
}
