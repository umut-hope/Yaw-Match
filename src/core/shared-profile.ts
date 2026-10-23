/**
 * Player profile shared by sibling sites on the same origin (yawmatch,
 * aimtune). Stored in localStorage under `shared:profile` as
 * `{ dpi, mainGame, sens }`. Pure functions only: callers own the storage.
 */
import { z } from 'zod'

export const SHARED_PROFILE_KEY = 'shared:profile'

export const SharedProfile = z.object({
  dpi: z.number().positive().max(100_000),
  mainGame: z
    .string()
    .max(32)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'mainGame must be a lowercase game id'),
  sens: z.number().positive().max(10_000),
})

export type SharedProfile = z.infer<typeof SharedProfile>

/** Parses a stored value. Anything missing, corrupt or out of range gives null. */
export function parseSharedProfile(raw: string | null | undefined): SharedProfile | null {
  if (!raw) return null
  try {
    const result = SharedProfile.safeParse(JSON.parse(raw))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

/** Serialises a profile, or returns null if it is not valid. */
export function serializeSharedProfile(profile: SharedProfile): string | null {
  const result = SharedProfile.safeParse(profile)
  return result.success ? JSON.stringify(result.data) : null
}
