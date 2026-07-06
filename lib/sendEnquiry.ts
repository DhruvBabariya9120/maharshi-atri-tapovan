import { Resend } from 'resend'

export type EnquiryInput = {
  studentName?: unknown
  standard?: unknown
  parentName?: unknown
  mobile?: unknown
  city?: unknown
  question?: unknown
}

export type EnquiryEnv = {
  RESEND_API_KEY?: string
  ENQUIRY_TO?: string
  ENQUIRY_FROM?: string
}

export type EnquiryResult = { status: number; body: { ok: true } | { error: string } }

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Framework-agnostic enquiry handler. Validates input, sends the email via
 * Resend, and returns an HTTP status + JSON body. Shared by the Vercel
 * serverless function (production) and the Vite dev middleware (local).
 */
export async function sendEnquiry(input: EnquiryInput, env: EnquiryEnv): Promise<EnquiryResult> {
  const apiKey = env.RESEND_API_KEY
  if (!apiKey) return { status: 500, body: { error: 'Email service not configured' } }

  const to = env.ENQUIRY_TO || 'atri_tapovan@yahoo.com'
  const from = env.ENQUIRY_FROM || 'MAT Admissions <onboarding@resend.dev>'

  const studentName = String(input.studentName ?? '').trim()
  const standard = String(input.standard ?? '').trim()
  const parentName = String(input.parentName ?? '').trim()
  const mobile = String(input.mobile ?? '').trim()
  const city = String(input.city ?? '').trim()
  const question = String(input.question ?? '').trim()

  if (!studentName || !standard || !parentName || !mobile) {
    return { status: 400, body: { error: 'Missing required fields' } }
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
              `<tr>
                <td style="padding:8px 12px;border:1px solid #e5e7eb;background:#f8fafc;font-weight:600;color:#0f172a;width:38%">${k}</td>
                <td style="padding:8px 12px;border:1px solid #e5e7eb;color:#334155">${escapeHtml(v)}</td>
              </tr>`,
          )
          .join('')}
      </table>
    </div>`

  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n')

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: `${parentName} <${to}>`,
      subject: `Admission enquiry — ${studentName} (${standard})`,
      html,
      text,
    })
    if (error) return { status: 502, body: { error: 'Could not send email' } }
    return { status: 200, body: { ok: true } }
  } catch {
    return { status: 500, body: { error: 'Unexpected error' } }
  }
}
