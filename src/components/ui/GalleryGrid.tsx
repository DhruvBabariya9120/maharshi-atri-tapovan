import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ImagePlaceholder } from './ImagePlaceholder'
import { galleryCategories, galleryItems } from '../../data/site'

const filters = [{ key: 'all', label: 'All' }, ...galleryCategories.map((c) => ({ key: c.key, label: c.label }))]

export function GalleryGrid() {
  const [active, setActive] = useState('all')
  const items = active === 'all' ? galleryItems : galleryItems.filter((i) => i.category === active)

  return (
    <div>
      <div className="mb-10 flex flex-wrap justify-center gap-2.5">
        {filters.map((f) => {
          const on = f.key === active
          return (
            <button
              key={f.key}
              onClick={() => setActive(f.key)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                on
                  ? 'border-brand bg-brand text-brand-fg'
                  : 'border-border bg-card text-content hover:border-brand hover:text-brand'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="group cursor-pointer overflow-hidden rounded-2xl"
            >
              <div className="transition-transform duration-500 group-hover:scale-105">
                <ImagePlaceholder label={item.label} icon={item.icon} ratio="square" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
