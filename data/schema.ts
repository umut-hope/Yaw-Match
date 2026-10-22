import { z } from 'zod'

/** How a game's field of view value is defined. Converted to vertical FOV internally. */
export const FovType = z.enum([
  'horizontal', // horizontal FOV at the user's actual aspect ratio
  'vertical', // vertical FOV, independent of aspect ratio
  'horizontal-4:3', // horizontal FOV referenced to a 4:3 frame (e.g. Source engine)
])

/** Shape of the in-game sensitivity slider. Only linear sliders are supported for now. */
export const SensCurve = z.enum(['linear'])

/** How much we trust the yaw value. */
export const VerifiedBy = z.enum(['official', 'measurement', 'community', 'unverified'])

export const Source = z.object({
  url: z.url(),
  title: z.string().min(1).optional(),
  note: z.string().min(1).optional(),
})

export const Fov = z
  .object({
    default: z.number().gt(0).lt(180),
    type: FovType,
    adjustable: z.boolean(),
    min: z.number().gt(0).lt(180).optional(),
    max: z.number().gt(0).lt(180).optional(),
  })
  .refine((f) => f.min === undefined || f.max === undefined || f.min <= f.max, {
    message: 'fov.min must be <= fov.max',
  })

export const Ads = z.object({
  multiplier: z.number().positive(),
  note: z.string().min(1).optional(),
})

export const Game = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'id must be a lowercase slug'),
    name: z.string().min(1),
    yaw: z.number().positive().finite(),
    sensCurve: SensCurve,
    /** null until the game's FOV has been researched; never guessed. */
    fov: Fov.nullable(),
    ads: Ads.nullable(),
    configFiles: z.array(z.string().min(1)),
    consoleCommand: z
      .string()
      .includes('{sens}', { message: 'consoleCommand must contain the {sens} placeholder' })
      .nullable(),
    sources: z.array(Source),
    verifiedBy: VerifiedBy,
    /** Caveats shown to players: conflicting sources, slider quirks, config multipliers. */
    notes: z.string().min(1).optional(),
  })
  .strict()
  .refine((g) => g.verifiedBy === 'unverified' || g.sources.length > 0, {
    message: 'yaw must have at least one source unless verifiedBy is "unverified"',
    path: ['sources'],
  })

export type Game = z.infer<typeof Game>
export type FovType = z.infer<typeof FovType>
export type VerifiedBy = z.infer<typeof VerifiedBy>
