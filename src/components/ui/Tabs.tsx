import { useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

export type Tab = {
  key: string
  label: string
  icon?: ReactNode
  content: ReactNode
}

export function Tabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.key)
  const reduce = useReducedMotion()
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])

  const current = tabs.find((t) => t.key === active) ?? tabs[0]
  const activeIndex = tabs.findIndex((t) => t.key === active)

  /** Roving keyboard navigation across the tablist (WCAG). */
  function handleKeyDown(e: React.KeyboardEvent) {
    let next = activeIndex
    if (e.key === 'ArrowRight') next = (activeIndex + 1) % tabs.length
    else if (e.key === 'ArrowLeft') next = (activeIndex - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    else return
    e.preventDefault()
    setActive(tabs[next].key)
    btnRefs.current[next]?.focus()
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Sections"
        onKeyDown={handleKeyDown}
        className="mx-auto mb-10 flex max-w-3xl gap-1.5 overflow-x-auto sm:flex-wrap sm:justify-center sm:overflow-visible"
      >
        {tabs.map((t, i) => {
          const selected = t.key === active
          return (
            <button
              key={t.key}
              ref={(el) => {
                btnRefs.current[i] = el
              }}
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={selected}
              aria-controls={`panel-${t.key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.key)}
              className={`relative flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                selected ? 'text-white' : 'text-content hover:bg-tint-blue-soft hover:text-brand'
              }`}
            >
              {selected && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-xl bg-linear-to-r from-brand to-accent shadow-lift"
                  transition={
                    reduce ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 32 }
                  }
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <motion.span
                  className="flex"
                  animate={{ scale: selected ? 1.12 : 1 }}
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 18 }}
                >
                  {t.icon}
                </motion.span>
                {t.label}
              </span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current?.key}
          role="tabpanel"
          id={`panel-${current?.key}`}
          aria-labelledby={`tab-${current?.key}`}
          tabIndex={0}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="outline-none"
        >
          {current?.content}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}