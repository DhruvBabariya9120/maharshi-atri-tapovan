import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Mail, MapPin, Phone, Send } from 'lucide-react'
import { Container } from '../ui/Container'
import { SocialIcon } from '../ui/SocialIcon'
import { contact, footer, site, TODO } from '../../data/site'
import logo from '../../assets/logo-256.png'

const socials = [
  { brand: 'whatsapp' as const, label: 'WhatsApp', href: contact.whatsappLink },
  { brand: 'facebook' as const, label: 'Facebook', href: contact.socials.facebook },
  { brand: 'instagram' as const, label: 'Instagram', href: contact.socials.instagram },
  { brand: 'youtube' as const, label: 'YouTube', href: contact.socials.youtube },
]

export function Footer() {
  const [email, setEmail] = useState('')

  function subscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    // TODO: connect newsletter to mailing list.
    toast.success(`Thanks for subscribing! We'll keep you posted.`)
    setEmail('')
  }

  return (
    <footer
      className="text-white bg-blue-900"
    >
      <Container className="grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-3">
            <img src={logo} alt="" className="h-14 w-14 object-cover" />
            <div>
              <div className="font-display font-bold text-white">{site.name}</div>
              <div className="text-xs text-white">{site.tagline}</div>
            </div>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-white">{footer.about}</p>
          <div className="mt-5 flex gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href === TODO ? '#' : s.href}
                aria-label={s.label}
                target="_blank"
                rel="noreferrer"
                className="hover:bg-accent flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-200 hover:-translate-y-0.5"
              >
                <SocialIcon brand={s.brand} className="h-[18px] w-[18px]" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold tracking-wide text-white uppercase">
            Quick Links
          </h4>
          <ul className="mt-5 flex flex-col gap-3">
            {footer.quickLinks.map((l) => (
              <li key={l.label}>
                {l.href ? (
                  <a
                    href={l.href}
                    className="group inline-flex items-center text-sm text-white transition-colors hover:text-white"
                  >
                    <span className="bg-accent mr-0 h-px w-0 transition-all duration-200 group-hover:mr-2 group-hover:w-4" />
                    {l.label}
                  </a>
                ) : (
                  <Link
                    to={l.to!}
                    className="group inline-flex items-center text-sm text-white transition-colors hover:text-white"
                  >
                    <span className="bg-accent mr-0 h-px w-0 transition-all duration-200 group-hover:mr-2 group-hover:w-4" />
                    {l.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold tracking-wide text-white uppercase">
            Contact
          </h4>
          <ul className="mt-5 flex flex-col gap-4 text-sm text-white">
            <li>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`}
                target="_blank"
                rel="noreferrer"
                className="flex gap-3 rounded-sm no-underline transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <MapPin className="text-accent mt-0.5 h-[18px] w-[18px] shrink-0" />
                {contact.address}
              </a>
            </li>
            <li>
              <a
                href={`tel:${contact.schoolOffice.replace(/\s+/g, '')}`}
                className="flex gap-3 rounded-sm no-underline transition-colors hover:text-white"
              >
                <Phone className="text-accent h-[18px] w-[18px] shrink-0" />
                {contact.schoolOffice === TODO ? 'Phone — coming soon' : contact.schoolOffice}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${contact.email}`}
                className="flex gap-3 rounded-sm break-all no-underline transition-colors hover:text-white"
              >
                <Mail className="text-accent mt-0.5 h-[18px] w-[18px] shrink-0" />
                {contact.email === TODO ? 'Email — coming soon' : contact.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold tracking-wide text-white uppercase">
            Newsletter
          </h4>
          <p className="mt-5 text-sm text-white">
            Get campus updates, event invites and admission notices.
          </p>
          <form onSubmit={subscribe} className="mt-4 flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              aria-label="Email address"
              className="focus:border-accent w-full rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/50 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Subscribe"
              className="bg-accent text-accent-fg flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform hover:-translate-y-0.5"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-3 py-6 text-xs text-white sm:flex-row">
          <span>{site.copyright}</span>
          <span className="flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-2.5 py-1 font-medium text-white">
              {site.board} · {site.medium}
            </span>
          </span>
        </Container>
      </div>
    </footer>
  )
}