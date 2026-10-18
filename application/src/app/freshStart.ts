/**
 * Every app open starts the demo from scratch: the previous load's session state is dropped.
 * The preferences modal opens only on the way in from the intro ("Zacznij"); `/mapa` opened directly
 * shows the map with the default profile.
 *
 * Side-effect module: main.tsx imports it before the store reads sessionStorage.
 */
import { STORAGE_KEY } from './config'

/** Forgets the stored app state (also used by Shift+R). */
export function forgetSession(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage unavailable (private mode) — nothing to forget */
  }
}

forgetSession()

let fromIntro = false

/** "Zacznij" on the intro: the map opens with the preferences modal. */
export function markStartedFromIntro(): void {
  fromIntro = true
}

/** Did this page load reach the map through the intro? */
export function startedFromIntro(): boolean {
  return fromIntro
}
