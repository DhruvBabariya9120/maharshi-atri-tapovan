import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'
import { Menu, Phone, X } from 'lucide-react'
import { Container } from '../ui/Container'
import { nav, site } from '../../data/site'
import logo from '../../assets/logo.svg'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 })

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 bg-brand-dark text-white"
      style={{
        backgroundImage:
          'radial-gradient(circle at 12% 18%, rgba(59,130,246,0.45), transparent 42%), radial-gradient(circle at 88% 22%, rgba(244,114,182,0.35), transparent 45%), radial-gradient(circle at 60% 90%, rgba(147,197,253,0.25), transparent 45%)',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Scroll progress bar */}
      <motion.div
        style={{ scaleX: progress }}
        className="absolute inset-x-0 top-0 z-10 h-0.5 origin-left bg-linear-to-r from-accent via-white to-accent"
        aria-hidden="true"
      />
      <Container as="nav" className="relative flex h-16 items-center gap-4 lg:h-20">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label={`${site.name} — home`}
        >
          <img src={logo} alt="" className="h-12 w-12 lg:h-16 lg:w-16" />
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
                    isActive ? 'font-semibold text-white' : 'font-medium text-white/85 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute inset-x-2.5 -bottom-0.5 h-0.5 rounded-full bg-white"
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
            className="flex h-11 w-11 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/10 xl:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </Container>

      {/* Mobile slide-in drawer — from the right, primary bg, white text */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-sm xl:hidden"
              aria-hidden="true"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: [0.4, 0, 0.2, 1], duration: 0.3 }}
              role="dialog"
              aria-modal="true"
              className="fixed inset-y-0 right-0 z-50 flex w-[min(20rem,85vw)] flex-col bg-brand-dark text-white shadow-2xl xl:hidden"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 8%, rgba(59,130,246,0.45), transparent 45%), radial-gradient(circle at 95% 15%, rgba(244,114,182,0.35), transparent 50%), radial-gradient(circle at 50% 95%, rgba(147,197,253,0.25), transparent 50%)',
              }}
            >
              <div className="flex h-16 items-center justify-between px-6 lg:h-20">
                <span className="font-display font-bold text-white">{site.name}</span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/10"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <motion.ul
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }}
                className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 py-6"
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
                        `block rounded-xl px-4 py-3.5 text-lg font-medium transition-colors ${
                          isActive
                            ? 'bg-white/15 text-white'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
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
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
