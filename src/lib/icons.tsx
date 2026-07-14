import {
  Award,
  BedDouble,
  BookOpen,
  Building2,
  Cctv,
  Drama,
  Droplets,
  FlaskConical,
  Flower2,
  GraduationCap,
  Hammer,
  HeartHandshake,
  Laptop,
  MapPin,
  Medal,
  MonitorSmartphone,
  Palette,
  PartyPopper,
  ShowerHead,
  Sparkles,
  SprayCan,
  Trees,
  Trophy,
  Users,
  Utensils,
  Volleyball,
  Wind,
  type LucideIcon,
} from 'lucide-react'

const map: Record<string, LucideIcon> = {
  Award,
  BedDouble,
  BookOpen,
  Building2,
  Cctv,
  Drama,
  Droplets,
  FlaskConical,
  Flower2,
  GraduationCap,
  Hammer,
  HeartHandshake,
  Laptop,
  MapPin,
  Medal,
  MonitorSmartphone,
  Palette,
  PartyPopper,
  ShowerHead,
  Sparkles,
  SprayCan,
  Trees,
  Trophy,
  Users,
  Utensils,
  Volleyball,
  Wind,
}

export function Icon({
  name,
  className,
  strokeWidth = 1.75,
}: {
  name: string
  className?: string
  strokeWidth?: number
}) {
  const Cmp = map[name] ?? Sparkles
  return <Cmp className={className} strokeWidth={strokeWidth} aria-hidden="true" />
}
