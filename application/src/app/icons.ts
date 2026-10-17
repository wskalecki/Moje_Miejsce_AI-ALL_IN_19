/** Lucide icons for the domain dictionary (spec §3.1, §3.2, §4.1). */
import {
  Dumbbell,
  Glasses,
  GraduationCap,
  HeartPulse,
  House,
  KeyRound,
  Martini,
  ShoppingBasket,
  Theater,
  TramFront,
  Trees,
  UsersRound,
  UtensilsCrossed,
  VolumeX,
  type LucideIcon,
} from 'lucide-react'
import type { CategoryKey, Horizon, ProfileId } from './types'

export const PROFILE_ICONS: Record<ProfileId, LucideIcon> = {
  student: GraduationCap,
  rodzina: UsersRound,
  senior: Glasses,
}

export const CATEGORY_ICONS: Record<CategoryKey, LucideIcon> = {
  cisza: VolumeX,
  zielen: Trees,
  komunikacja: TramFront,
  gastronomia: UtensilsCrossed,
  sport: Dumbbell,
  kultura: Theater,
  edukacja: GraduationCap,
  zdrowie: HeartPulse,
  zakupy: ShoppingBasket,
  zycieNocne: Martini,
}

export const HORIZON_ICONS: Record<Horizon, LucideIcon> = {
  chwila: KeyRound,
  stale: House,
}
