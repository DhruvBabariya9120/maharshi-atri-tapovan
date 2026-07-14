import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Icon } from '../../lib/icons'
import { galleryCategories, galleryItems, type GalleryItem } from '../../data/site'

const filters = [{ key: 'all', label: 'All' }, ...galleryCategories.map((c) => ({ key: c.key, label: c.label }))]
const categoryLabel = Object.fromEntries(galleryCategories.map((c) => [c.key, c.label]))

function Lightbox({ item, onClose, onSelect }: { item: GalleryItem; onClose: () => void; onSelect: (i: GalleryItem) => void }) {
  // suggestions: every photo from the same category
  const related = galleryItems.filter((i) => i.category === item.category)
  const index = related.findIndex((i) => i.id === item.id)
  const step = (d: number) => onSelect(related[(index + d + related.length) % related.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    document.documentElement.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
    }
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${categoryLabel[item.category]} photo viewer`}
    >
      {/* top bar */}
      <div className="flex items-center justify-between gap-4 p-4 sm:px-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex min-w-0 items-center gap-2 text-white">
          <Icon name={item.icon} className="h-4 w-4 shrink-0 text-white/80" />
          <span className="truncate text-sm font-semibold">{categoryLabel[item.category]}</span>
          <span className="shrink-0 text-xs text-white/60">
            {index + 1} / {related.length}
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close photo viewer"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* main image + prev/next */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 sm:px-16">
        <button
          onClick={(e) => {
            e.stopPropagation()
            step(-1)
          }}
          aria-label="Previous photo"
          className="absolute left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 sm:left-4 sm:h-11 sm:w-11"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <AnimatePresence mode="wait">
          <motion.img
            key={item.id}
            src={item.src}
            alt={item.alt}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="max-h-full max-w-full rounded-xl object-contain shadow-lift"
            onClick={(e) => e.stopPropagation()}
          />
        </AnimatePresence>
        <button
          onClick={(e) => {
            e.stopPropagation()
            step(1)
          }}
          aria-label="Next photo"
          className="absolute right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 sm:right-4 sm:h-11 sm:w-11"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* caption + same-category suggestions */}
      <div className="p-4 sm:px-6" onClick={(e) => e.stopPropagation()}>
        <p className="mx-auto mb-3 max-w-2xl text-center text-xs leading-relaxed text-white/70 sm:text-sm">{item.alt}</p>
        <div className="flex justify-start gap-2 overflow-x-auto pb-1 sm:justify-center">
          {related.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelect(r)}
              aria-label={r.alt}
              aria-current={r.id === item.id}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:h-16 sm:w-24 ${
                r.id === item.id ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-90'
              }`}
            >
              <img src={r.src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export function GalleryGrid() {
  const [active, setActive] = useState('all')
  const [selected, setSelected] = useState<GalleryItem | null>(null)
  const items = active === 'all' ? galleryItems : galleryItems.filter((i) => i.category === active)

  return (
    <div>
      {/* filter pills — horizontal scroll strip on mobile, centered wrap on larger screens */}
      <div className="-mx-4 mb-8 flex gap-2.5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:mb-10 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0">
        {filters.map((f) => {
          const on = f.key === active
          const count =
            f.key === 'all' ? galleryItems.length : galleryItems.filter((i) => i.category === f.key).length
          return (
            <button
              key={f.key}
              onClick={() => setActive(f.key)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                on
                  ? 'border-brand bg-brand text-brand-fg'
                  : 'border-border bg-card text-content hover:border-brand hover:text-brand'
              }`}
            >
              {f.label}
              <span className={`ml-1.5 text-xs ${on ? 'text-brand-fg/70' : 'text-muted'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* masonry columns — photos keep their natural aspect ratio, no cropping */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="columns-2 gap-3 sm:gap-5 lg:columns-3"
        >
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              aria-label={`View photo: ${item.alt}`}
              className="group relative mb-3 block w-full break-inside-avoid cursor-pointer overflow-hidden rounded-xl border border-border bg-card text-left sm:mb-5 sm:rounded-2xl"
            >
              <img
                src={item.src}
                alt={item.alt}
                loading="lazy"
                decoding="async"
                className="w-full transition-transform duration-500 group-hover:scale-105"
              />
              {/* category tag on every photo */}
              <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-linear-to-t from-black/70 via-black/35 to-transparent p-3 pt-10">
                <Icon name={item.icon} className="h-3.5 w-3.5 shrink-0 text-white/90" />
                <span className="truncate text-xs font-semibold text-white">{categoryLabel[item.category]}</span>
              </span>
            </button>
          ))}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {selected && <Lightbox item={selected} onClose={() => setSelected(null)} onSelect={setSelected} />}
      </AnimatePresence>
    </div>
  )
}