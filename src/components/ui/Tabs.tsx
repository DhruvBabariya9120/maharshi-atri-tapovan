import { useState } from 'react'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export type Tab = {
  key: string
  label: string
  icon?: ReactNode
  content: ReactNode
}

export function Tabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.key)
  const current = tabs.find((t) => t.key === active) ?? tabs[0]

  return (
    <div>
      <div
        role="tablist"
        aria-label="Sections"
        className="mx-auto mb-10 flex max-w-3xl flex-wrap justify-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-card"
      >
        {tabs.map((t) => {
          const selected = t.key === active
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(t.key)}
              className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${
                selected ? 'text-brand-fg' : 'text-content hover:text-brand'
              }`}
            >
              {selected && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-xl bg-brand"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {t.icon}
                {t.label}
              </span>
            </button>
          )
        })}
      </div>

      <motion.div
        key={current?.key}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {current?.content}
      </motion.div>
    </div>
  )
}
