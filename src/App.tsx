import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'sonner'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { PageLoader } from './components/layout/PageLoader'
import { ScrollToTop } from './components/layout/ScrollToTop'
import { pageVariants } from './lib/motion'

function App() {
  const { pathname } = useLocation()

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
