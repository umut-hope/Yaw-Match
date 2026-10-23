/**
 * Field of view conversions. Pure functions only.
 *
 * Games describe FOV in different ways. Everything is converted through the
 * vertical FOV, which does not depend on the aspect ratio of the screen:
 *
 *   tan(h / 2) = tan(v / 2) × aspect
 *
 * All angles are in degrees; `aspect` is width / height of the rendered image
 * (16 / 9 for a 1920 × 1080 screen).
 */
import { assertPositive } from './convert'

/** How a game's FOV value is defined. Mirrors `FovType` in the game data schema. */
export const FOV_TYPES = ['horizontal', 'vertical', 'horizontal-4:3'] as const
export type FovType = (typeof FOV_TYPES)[number]

/** Aspect ratio that `horizontal-4:3` values are referenced to. */
export const ASPECT_4_3 = 4 / 3

const toRadians = (deg: number): number => (deg * Math.PI) / 180
const toDegrees = (rad: number): number => (rad * 180) / Math.PI

function assertFov(name: string, value: number): void {
  if (!(Number.isFinite(value) && value > 0 && value < 180)) {
    throw new RangeError(`${name} must be between 0 and 180 degrees, got ${value}`)
  }
}

/** Horizontal FOV for a vertical FOV at the given aspect ratio. */
export function horizontalFromVertical(verticalDeg: number, aspect: number): number {
  assertFov('verticalDeg', verticalDeg)
  assertPositive('aspect', aspect)
  return toDegrees(2 * Math.atan(Math.tan(toRadians(verticalDeg) / 2) * aspect))
}

/** Vertical FOV for a horizontal FOV at the given aspect ratio. */
export function verticalFromHorizontal(horizontalDeg: number, aspect: number): number {
  assertFov('horizontalDeg', horizontalDeg)
  assertPositive('aspect', aspect)
  return toDegrees(2 * Math.atan(Math.tan(toRadians(horizontalDeg) / 2) / aspect))
}

/**
 * Vertical FOV that a game's FOV value produces on a screen with the given
 * aspect ratio. For `horizontal-4:3` the result does not depend on `aspect`.
 */
export function toVerticalFov(value: number, type: FovType, aspect: number): number {
  switch (type) {
    case 'vertical':
      assertFov('value', value)
      return value
    case 'horizontal':
      return verticalFromHorizontal(value, aspect)
    case 'horizontal-4:3':
      return verticalFromHorizontal(value, ASPECT_4_3)
  }
}

/** Inverse of `toVerticalFov`: the game FOV value that gives this vertical FOV. */
export function fromVerticalFov(verticalDeg: number, type: FovType, aspect: number): number {
  switch (type) {
    case 'vertical':
      assertFov('verticalDeg', verticalDeg)
      return verticalDeg
    case 'horizontal':
      return horizontalFromVertical(verticalDeg, aspect)
    case 'horizontal-4:3':
      return horizontalFromVertical(verticalDeg, ASPECT_4_3)
  }
}

/** Converts a FOV value between two definitions, on the same screen. */
export function convertFov(value: number, from: FovType, to: FovType, aspect: number): number {
  return fromVerticalFov(toVerticalFov(value, from, aspect), to, aspect)
}
