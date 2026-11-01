import type { ReactNode } from 'react'
import { useEffect } from 'react'
import logo from '../../assets/logo-256.png'
import { site } from '../../data/site'

type Props = {
  /** Pane label under the school name, e.g. "Student portal". */
  kicker: string
  headline: string
  lead: string
  footnote?: ReactNode
  /** Browser tab title. */
  title: string
  children: ReactNode
}

/** Two-pane sign-in layout: brand panel on the left, form on the right. */
export function AuthLayout({ kicker, headline, lead, footnote, title, children }: Props) {
  useEffect(() => {
    document.title = `${title} | ${site.name}`
  }, [title])

  return (
    <div className="bg-surface flex min-h-screen flex-col lg:flex-row">
      <aside className="bg-brand-dark flex flex-col justify-between gap-10 px-6 py-10 text-white sm:px-12 lg:w-[46%] lg:px-16 lg:py-14">
        <div className="flex items-center gap-3.5">
          <img src={logo} alt="" className="h-14 w-14 rounded-full bg-white" />
          <div className="flex flex-col">
            <span className="font-display text-lg font-semibold">{site.name}</span>
            <span className="text-sm text-blue-200">{kicker}</span>
          </div>
        </div>
        <div className="flex max-w-md flex-col gap-4">
          <h1 className="font-display text-3xl leading-tight font-bold text-white lg:text-4xl">
            {headline}
          </h1>
          <p className="text-base leading-relaxed text-blue-100">{lead}</p>
        </div>
        {footnote && <p className="text-sm text-blue-300">{footnote}</p>}
      </aside>
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="flex w-full max-w-[400px] flex-col gap-5">{children}</div>
      </main>
    </div>
  )
}

export function AuthHeading({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="font-display text-heading text-[28px] font-semibold">{title}</h2>
      {sub && <p className="text-muted text-sm">{sub}</p>}
    </div>
  )
}

const tones = {
  error: 'bg-red-50 text-red-800',
  warning: 'bg-amber-50 text-amber-800',
  success: 'bg-green-50 text-green-800',
} as const

export function Notice({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  return (
    <div
      role={tone === 'success' ? 'status' : 'alert'}
      className={`rounded-xl px-3.5 py-3 text-[13px] leading-relaxed ${tones[tone]}`}
    >
      {children}
    </div>
  )
}
