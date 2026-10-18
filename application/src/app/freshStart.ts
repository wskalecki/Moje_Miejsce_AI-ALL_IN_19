/**
 * Every app open starts the demo from scratch: the previous load's session state and hints are dropped.
 * The preferences modal opens only on the way in from the intro ("Zacznij"); `/mapa` opened directly
 * shows the map with the default profile.
 *
 * Side-effect module: main.tsx imports it before the store reads sessionStorage.
 */
import { PANEL_HINT_KEY, STORAGE_KEY } from './config'

/** Forgets the stored app state and the dismissed panel hint (also used by Shift+R). */
export function forgetSession(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
    window.sessionStorage.removeItem(PANEL_HINT_KEY)
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
