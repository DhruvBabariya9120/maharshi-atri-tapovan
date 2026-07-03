import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Phone, X } from 'lucide-react'
import { Container } from '../ui/Container'
import { nav, site } from '../../data/site'
import logo from '../../assets/logo.svg'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const onHome = pathname === '/'
  const transparent = onHome && !scrolled

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        transparent
          ? 'bg-transparent'
          : 'border-b border-border bg-[var(--glass)] backdrop-blur-xl shadow-card'
      }`}
    >
      <Container as="nav" className="flex h-16 items-center gap-4 lg:h-20">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label={`${site.name} — home`}
        >
          <img src={logo} alt="" className="h-9 w-9 rounded-full object-cover lg:h-11 lg:w-11" />
          <span
            className={`font-display text-base font-bold tracking-tight whitespace-nowrap sm:text-lg ${
              transparent ? 'text-white' : 'text-heading'
            }`}
          >
            {site.name}
          </span>
        </Link>

        {/* Desktop links — centered zone */}
        <ul className="hidden flex-1 items-center justify-center gap-0.5 xl:flex">
          {nav.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `relative rounded-lg px-2.5 py-2 text-sm transition-colors duration-200 ${
                    transparent
                      ? 'font-medium text-white/90 hover:text-white'
                      : isActive
                        ? 'font-semibold text-brand'
                        : 'font-medium text-content hover:text-brand'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className={`absolute inset-x-2.5 -bottom-0.5 h-0.5 rounded-full ${
                          transparent ? 'bg-white' : 'bg-brand'
                        }`}
                      />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            to="/admissions"
            className="hidden rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg shadow-[0_8px_20px_-8px_rgba(244,114,182,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-strong sm:inline-flex"
          >
            Admission Enquiry
          </Link>
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors xl:hidden ${
              transparent ? 'text-white hover:bg-white/10' : 'text-heading hover:bg-surface'
            }`}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </Container>

      {/* Mobile full-screen menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-brand-dark/95 backdrop-blur-xl xl:hidden"
          >
            <Container className="flex h-16 items-center justify-between lg:h-20">
              <span className="font-display font-bold text-white">{site.name}</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white hover:bg-white/10"
              >
                <X className="h-6 w-6" />
              </button>
            </Container>
            <motion.ul
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }}
              className="flex flex-col gap-1 px-6 py-6"
            >
              {nav.map((item) => (
                <motion.li
                  key={item.to}
                  variants={{ hidden: { opacity: 0, x: 24 }, show: { opacity: 1, x: 0 } }}
                >
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `block rounded-xl px-4 py-3.5 text-xl font-medium transition-colors ${
                        isActive ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </motion.li>
              ))}
              <motion.li
                variants={{ hidden: { opacity: 0, x: 24 }, show: { opacity: 1, x: 0 } }}
                className="mt-4"
              >
                <a
                  href="tel:"
                  className="flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-base font-semibold text-accent-fg"
                >
                  <Phone className="h-4 w-4" /> Call the School Office
                </a>
              </motion.li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
