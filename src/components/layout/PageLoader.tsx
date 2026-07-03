import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import logo from '../../assets/logo.svg'
import { site } from '../../data/site'

export function PageLoader() {
  const [done, setDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1700)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-body"
        >
          <div className="relative flex items-center justify-center">
            <motion.span
              className="absolute rounded-full"
              style={{
                width: 140,
                height: 140,
                background:
                  'radial-gradient(circle, rgba(29,78,216,0.25), rgba(244,114,182,0.15) 60%, transparent 70%)',
              }}
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.img
              src={logo}
              alt={site.name}
              className="relative h-24 w-24 object-contain"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-6 text-center"
          >
            <div className="font-display text-lg font-bold text-heading">{site.name}</div>
            <div className="text-xs tracking-wide text-muted">{site.tagline}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
