import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'accent' | 'outline' | 'ghost'
type Size = 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 disabled:pointer-events-none'

const variants: Record<Variant, string> = {
  primary:
    'bg-brand text-brand-fg shadow-[0_8px_20px_-8px_rgba(29,78,216,0.6)] hover:bg-brand-dark hover:shadow-lift',
  accent:
    'bg-accent text-accent-fg shadow-[0_8px_20px_-8px_rgba(244,114,182,0.7)] hover:bg-accent-strong',
  outline: 'border border-border bg-card text-heading hover:border-brand hover:text-brand',
  ghost: 'text-heading hover:bg-tint-blue',
}

const sizes: Record<Size, string> = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

type Props = {
  children: ReactNode
  variant?: Variant
  size?: Size
  to?: string
  href?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  to,
  href,
  onClick,
  type = 'button',
  disabled,
  className = '',
}: Props) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`
  const motionProps = {
    whileHover: { y: -2 },
    whileTap: { scale: 0.97 },
  }

  if (to) {
    return (
      <motion.span {...motionProps} className="inline-flex">
        <Link to={to} className={cls}>
          {children}
        </Link>
      </motion.span>
    )
  }
  if (href) {
    return (
      <motion.a {...motionProps} href={href} className={cls} target="_blank" rel="noreferrer">
        {children}
      </motion.a>
    )
  }
  return (
    <motion.button
      {...motionProps}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cls}
    >
      {children}
    </motion.button>
  )
}
