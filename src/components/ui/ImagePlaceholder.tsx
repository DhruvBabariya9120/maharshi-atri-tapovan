import { ImageIcon } from 'lucide-react'
import { Icon } from '../../lib/icons'

type Ratio = 'video' | 'square' | 'portrait' | 'wide' | 'auto'

const ratios: Record<Ratio, string> = {
  video: 'aspect-[9/7]',
  square: 'aspect-[8/8]',
  portrait: 'aspect-[3/4]',
  wide: 'aspect-[16/9]',
  auto: '',
}

/**
 * Renders a real photo when `src` is supplied, otherwise a branded
 * "photo coming soon" placeholder with an icon + label.
 */
export function ImagePlaceholder({
  label,
  icon,
  ratio = 'video',
  className = '',
  src,
  alt,
}: {
  label?: string
  icon?: string
  ratio?: Ratio
  className?: string
  src?: string
  alt?: string
}) {
  if (src) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-border bg-card ${ratios[ratio]} ${className}`}
      >
        <img
          src={src}
          alt={alt ?? label ?? ''}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-tint-blue via-card to-tint-pink ${ratios[ratio]} ${className}`}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(29,78,216,0.18), transparent 45%), radial-gradient(circle at 80% 80%, rgba(244,114,182,0.22), transparent 45%)',
        }}
        aria-hidden="true"
      />
      <div className="relative flex flex-col items-center gap-2 px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card/70 text-brand shadow-card backdrop-blur">
          {icon ? <Icon name={icon} className="h-6 w-6" /> : <ImageIcon className="h-6 w-6" aria-hidden="true" />}
        </div>
        {label && <span className="text-sm font-medium text-heading/80">{label}</span>}
        <span className="text-[11px] font-medium tracking-wide text-muted uppercase">Photo coming soon</span>
      </div>
    </div>
  )
}