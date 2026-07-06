import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'

// Self-contained on purpose: Vercel bundles this file as an ESM function, and a
// relative `../lib` import can fail module resolution at load time (surfacing as
// FUNCTION_INVOCATION_FAILED before any try/catch runs). The Vite dev middleware
// shares lib/sendEnquiry.ts; this keeps production isolated and robust.

const TO = process.env.ENQUIRY_TO || 'atri_tapovan@yahoo.com'
const FROM = process.env.ENQUIRY_FROM || 'MAT Admissions <update.atritapovan.com>'

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'Email service not configured' })

    let raw: unknown = req.body
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw || '{}')
      } catch {
        return res.status(400).json({ error: 'Invalid JSON body' })
      }
    }
    const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>

    const studentName = String(body.studentName ?? '').trim()
    const standard = String(body.standard ?? '').trim()
    const parentName = String(body.parentName ?? '').trim()
    const mobile = String(body.mobile ?? '').trim()
    const city = String(body.city ?? '').trim()
    const question = String(body.question ?? '').trim()

    if (!studentName || !standard || !parentName || !mobile) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const rows: [string, string][] = [
      ['Student', studentName],
      ['Standard', standard],
      ['Parent / Guardian', parentName],
      ['Mobile', mobile],
      ['Village / City', city || '—'],
      ['Question', question || '—'],
    ]

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#1d4ed8;margin:0 0 4px">New Admission Enquiry</h2>
        <p style="color:#64748b;margin:0 0 16px">Maharshi Atri Tapovan — request a call back</p>
        <table style="width:100%;border-collapse:collapse">
          ${rows
            .map(
              ([k, v]) =>
                `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;background:#f8fafc;font-weight:600;color:#0f172a;width:38%">${k}</td><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#334155">${escapeHtml(v)}</td></tr>`
            )
            .join('')}
        </table>
      </div>`
    const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n')

    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: `${parentName} <${TO}>`,
      subject: `Admission enquiry — ${studentName} (${standard})`,
      html,
      text,
    })
    if (error) {
      console.error('resend error:', error)
      return res
        .status(502)
        .json({ error: 'Could not send email', detail: error.message ?? String(error) })
    }
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('enquiry handler crashed:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
