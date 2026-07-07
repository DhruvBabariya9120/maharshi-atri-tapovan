import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'sonner'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { PageLoader } from './components/layout/PageLoader'
import { ScrollToTop } from './components/layout/ScrollToTop'
import { pageVariants } from './lib/motion'
import { SITE_URL, seoRoutes, site } from './data/site'

/** Create or update a <meta>/<link> tag in <head> so it stays a singleton. */
function upsertTag(selector: string, create: () => HTMLElement, apply: (el: HTMLElement) => void) {
  let el = document.head.querySelector<HTMLElement>(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  apply(el)
}

function useRouteSeo(pathname: string) {
  useEffect(() => {
    const match = seoRoutes.find((r) => r.path === pathname)
    const title = match ? match.title : site.seoTitle
    const description = match ? match.description : site.metaDescription
    const canonical = `${SITE_URL}${pathname === '/' ? '/' : pathname}`

    document.title = title

    upsertTag(
      'meta[name="description"]',
      () => Object.assign(document.createElement('meta'), { name: 'description' }),
      (el) => el.setAttribute('content', description)
    )
    upsertTag(
      'link[rel="canonical"]',
      () => Object.assign(document.createElement('link'), { rel: 'canonical' }),
      (el) => el.setAttribute('href', canonical)
    )
    upsertTag(
      'meta[property="og:title"]',
      () => {
        const m = document.createElement('meta')
        m.setAttribute('property', 'og:title')
        return m
      },
      (el) => el.setAttribute('content', title)
    )
    upsertTag(
      'meta[property="og:description"]',
      () => {
        const m = document.createElement('meta')
        m.setAttribute('property', 'og:description')
        return m
      },
      (el) => el.setAttribute('content', description)
    )
    upsertTag(
      'meta[property="og:url"]',
      () => {
        const m = document.createElement('meta')
        m.setAttribute('property', 'og:url')
        return m
      },
      (el) => el.setAttribute('content', canonical)
    )
  }, [pathname])
}

function App() {
  const { pathname } = useLocation()

  useRouteSeo(pathname)

  return (
    <>
      <PageLoader />
      <ScrollToTop />
      <Navbar />
      <main className="min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            variants={pageVariants}
            initial="initial"
            animate="enter"
            exit="exit"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <Toaster position="top-center" richColors closeButton />
    </>
  )
}

export default App
