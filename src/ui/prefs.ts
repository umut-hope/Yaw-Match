import { getStorage } from './settings'

// Both sibling sites share one origin, so every key is namespaced.
export const PAD_WIDTH_KEY = 'yawmatch:pad-width'
export const PROMO_DISMISSED_KEY = 'yawmatch:promo-dismissed-until'

export const DEFAULT_PAD_WIDTH_CM = 45
const MIN_PAD_CM = 10
const MAX_PAD_CM = 200

export function isValidPadWidth(cm: number): boolean {
  return Number.isFinite(cm) && cm >= MIN_PAD_CM && cm <= MAX_PAD_CM
}

/** Saved pad width in cm, or null if the player never set one. */
export function loadPadWidth(): number | null {
  try {
    const raw = getStorage()?.getItem(PAD_WIDTH_KEY)
    if (!raw) return null
    const cm = Number(raw)
    return isValidPadWidth(cm) ? cm : null
  } catch {
    return null
  }
}

export function savePadWidth(cm: number): void {
  if (!isValidPadWidth(cm)) return
  try {
    getStorage()?.setItem(PAD_WIDTH_KEY, String(cm))
  } catch {
    // Not remembered; still used for this visit.
  }
}

export function isPromoDismissed(now = Date.now()): boolean {
  try {
    const until = Number(getStorage()?.getItem(PROMO_DISMISSED_KEY))
    return Number.isFinite(until) && until > now
  } catch {
    return false
  }
}

export function dismissPromo(days: number, now = Date.now()): void {
  try {
    getStorage()?.setItem(PROMO_DISMISSED_KEY, String(now + days * 24 * 60 * 60 * 1000))
  } catch {
    // Hidden for this visit only.
  }
}
