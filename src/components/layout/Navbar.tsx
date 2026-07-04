import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from 'framer-motion'
import { Menu, Phone, X } from 'lucide-react'
import { nav, site } from '../../data/site'
import logo from '../../assets/logo.svg'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const { pathname } = useLocation()
  const { scrollY, scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 })
  const lastY = useRef(0)
  const stopTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = lastY.current
    lastY.current = y
    // Hide only when scrolling down past the header height; show when scrolling up.
    if (y > prev && y > 120) setHidden(true)
    else if (y < prev) setHidden(false)

    // Reveal again when scrolling stops.
    clearTimeout(stopTimer.current)
    stopTimer.current = setTimeout(() => setHidden(false), 200)
  })

  useEffect(() => () => clearTimeout(stopTimer.current), [])

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <motion.header
      animate={{ y: hidden && !open ? '-130%' : '0%' }}
      transition={{ type: 'tween', ease: [0.4, 0, 0.2, 1], duration: 0.35 }}
      className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4"
    >
      <nav className="relative mx-auto flex h-18 max-w-7xl items-center gap-4 overflow-hidden rounded-2xl border border-border bg-white px-5 shadow-[0_12px_32px_-14px_rgba(15,23,42,0.28)] sm:px-8 lg:h-20">
        {/* Scroll progress bar */}
        <motion.div
          style={{ scaleX: progress }}
          className="absolute inset-x-0 top-0 z-10 h-0.5 origin-left bg-linear-to-r from-brand via-accent to-brand"
          aria-hidden="true"
        />
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
                    isActive ? 'font-semibold text-brand' : 'font-medium text-brand hover:text-accent-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute inset-x-2.5 -bottom-0.5 h-0.5 rounded-full bg-brand"
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
            className="hidden rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(29,78,216,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-dark sm:inline-flex"
          >
            Admission Enquiry
          </Link>
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-heading transition-colors hover:bg-brand/10 xl:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>

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
              className="fixed inset-y-0 right-0 z-50 flex w-[min(20rem,85vw)] flex-col border-l border-border bg-white text-heading shadow-2xl xl:hidden"
            >
              <div className="flex h-16 items-end justify-end  px-6 lg:h-20">
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-heading transition-colors hover:bg-brand/10"
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
                            ? 'bg-brand/10 font-semibold text-brand'
                            : 'text-brand hover:bg-brand/10 hover:text-brand-dark'
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
                    className="flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-brand-dark"
                  >
                    <Phone className="h-4 w-4" /> Call the School Office
                  </a>
                </motion.li>
              </motion.ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  )
}