import { SHARED_PROFILE_KEY, parseSharedProfile, serializeSharedProfile } from '../core/shared-profile'

/** User input as typed. Kept as strings so half-typed values like "1." survive. */
export interface Settings {
  from: string
  to: string
  sens: string
  dpi: string
}

// Namespaced: sibling sites on the same origin share localStorage.
export const STORAGE_KEY = 'yawmatch:profile'
/** Key used before namespacing; read once and removed on the next save. */
export const LEGACY_STORAGE_KEY = 'sensfinder.profile.v1'
const KEYS = ['from', 'to', 'sens', 'dpi'] as const

/** Parses a user-typed positive number; accepts "," as decimal separator. */
export function parsePositive(input: string): number | null {
  const trimmed = input.trim().replace(',', '.')
  if (!/^\d*\.?\d+$|^\d+\.$/.test(trimmed)) return null
  const n = Number(trimmed)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Formats a number with up to `decimals` places, trimming trailing zeros. */
export function formatNumber(n: number, decimals = 4): string {
  if (!Number.isFinite(n)) return '–'
  return String(Number(n.toFixed(decimals)))
}

function pick(source: (key: string) => string | null | undefined): Partial<Settings> {
  const out: Partial<Settings> = {}
  for (const key of KEYS) {
    const value = source(key)
    if (typeof value === 'string' && value.length > 0 && value.length <= 32) out[key] = value
  }
  return out
}

export function fromQuery(search: string): Partial<Settings> {
  const params = new URLSearchParams(search)
  return pick((k) => params.get(k))
}

export function toQuery(s: Settings): string {
  const params = new URLSearchParams()
  for (const key of KEYS) {
    const value = s[key].trim()
    if (!value) continue
    // Shared links always use "." so they read the same in every locale.
    params.set(key, key === 'sens' || key === 'dpi' ? value.replace(',', '.') : value)
  }
  return `?${params.toString()}`
}

/** Reads the saved profile. Storage may be missing or throw (private mode, blocked). */
export function loadProfile(storage: Pick<Storage, 'getItem'> | undefined): Partial<Settings> {
  try {
    const raw = storage?.getItem(STORAGE_KEY) ?? storage?.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    const record = parsed as Record<string, unknown>
    return pick((k) => (typeof record[k] === 'string' ? (record[k] as string) : null))
  } catch {
    return {}
  }
}

export function saveProfile(
  storage: (Pick<Storage, 'setItem'> & Partial<Pick<Storage, 'removeItem'>>) | undefined,
  s: Settings,
): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(s))
    storage?.removeItem?.(LEGACY_STORAGE_KEY)
  } catch {
    // Storage full or blocked: the profile just isn't remembered.
  }
}

/**
 * Reads the profile shared with sibling sites (`shared:profile`), mapped to
 * converter settings: the main game becomes the source game.
 */
export function loadSharedProfile(storage: Pick<Storage, 'getItem'> | undefined): Partial<Settings> {
  try {
    const profile = parseSharedProfile(storage?.getItem(SHARED_PROFILE_KEY))
    if (!profile) return {}
    return { from: profile.mainGame, sens: formatNumber(profile.sens), dpi: formatNumber(profile.dpi, 0) }
  } catch {
    return {}
  }
}

/**
 * Writes the source game, sens and DPI to the shared profile so sibling sites
 * can prefill them. Skipped while the input is incomplete or the game unknown.
 */
export function saveSharedProfile(
  storage: Pick<Storage, 'setItem'> | undefined,
  s: Settings,
  isKnownGame: (id: string) => boolean,
): void {
  const sens = parsePositive(s.sens)
  const dpi = parsePositive(s.dpi)
  if (sens === null || dpi === null || !isKnownGame(s.from)) return
  const value = serializeSharedProfile({ dpi, mainGame: s.from, sens })
  if (value === null) return
  try {
    storage?.setItem(SHARED_PROFILE_KEY, value)
  } catch {
    // Storage full or blocked: the profile just isn't shared.
  }
}

/**
 * Merges settings by priority: URL query > saved profile > defaults.
 * Unknown game ids fall back to the next source.
 */
export function resolveSettings(
  layers: Partial<Settings>[],
  defaults: Settings,
  isKnownGame: (id: string) => boolean,
): Settings {
  const result = { ...defaults }
  for (const key of KEYS) {
    for (const layer of layers) {
      const value = layer[key]
      if (value === undefined) continue
      if ((key === 'from' || key === 'to') && !isKnownGame(value)) continue
      result[key] = value
      break
    }
  }
  return result
}

/** Safe accessor: touching `window.localStorage` itself can throw in some browsers. */
export function getStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}
