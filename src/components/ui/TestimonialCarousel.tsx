import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'

export type Testimonial = { quote: string; author: string; role: string }

export function TestimonialCarousel({ items }: { items: Testimonial[] }) {
  const [[index, dir], setState] = useState<[number, number]>([0, 0])
  const item = items[index]

  const go = (d: number) => setState([(index + d + items.length) % items.length, d])

  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-card sm:p-12">
        <Quote className="mb-6 h-10 w-10 text-accent" aria-hidden="true" />
        <div className="relative min-h-[160px] sm:min-h-[130px]">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.blockquote
              key={index}
              custom={dir}
              initial={{ opacity: 0, x: dir >= 0 ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir >= 0 ? -40 : 40 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0"
            >
              <p className="text-lg leading-relaxed font-medium text-heading sm:text-xl">
                “{item.quote}”
              </p>
              <footer className="mt-6">
                <span className="font-semibold text-brand">{item.author}</span>
                <span className="ml-2 text-sm text-muted">· {item.role}</span>
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          onClick={() => go(-1)}
          aria-label="Previous testimonial"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-heading transition-colors hover:border-brand hover:text-brand"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to testimonial ${i + 1}`}
              onClick={() => setState([i, i > index ? 1 : -1])}
              className={`h-2.5 rounded-full transition-all ${
                i === index ? 'w-6 bg-brand' : 'w-2.5 bg-border hover:bg-muted'
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => go(1)}
          aria-label="Next testimonial"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-heading transition-colors hover:border-brand hover:text-brand"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
