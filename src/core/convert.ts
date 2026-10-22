/**
 * Core sensitivity math. Pure functions only: no DOM, no UI, no game data imports.
 *
 * Every game reduces to:
 *   degrees_turned = counts × sens × yaw
 * where `counts` are raw mouse units and `yaw` is a per-game constant in degrees per count.
 */

export const CM_PER_INCH = 2.54
export const DEGREES_PER_TURN = 360

function assertPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite number greater than 0, got ${value}`)
  }
}

/** Degrees turned per mouse count at the given in-game sensitivity. */
export function degreesPerCount(sens: number, yaw: number): number {
  assertPositive('sens', sens)
  assertPositive('yaw', yaw)
  return sens * yaw
}

/** Mouse counts needed for a full 360° turn. */
export function countsPer360(sens: number, yaw: number): number {
  return DEGREES_PER_TURN / degreesPerCount(sens, yaw)
}

/** Physical inches of mouse travel for a full 360° turn. */
export function inchesPer360(sens: number, yaw: number, dpi: number): number {
  assertPositive('dpi', dpi)
  return countsPer360(sens, yaw) / dpi
}

/** Physical centimetres of mouse travel for a full 360° turn. */
export function cmPer360(sens: number, yaw: number, dpi: number): number {
  return inchesPer360(sens, yaw, dpi) * CM_PER_INCH
}

/** Effective DPI: sensitivity multiplied by mouse DPI. */
export function edpi(sens: number, dpi: number): number {
  assertPositive('sens', sens)
  assertPositive('dpi', dpi)
  return sens * dpi
}

/**
 * 360-distance conversion: returns the target-game sensitivity that gives the
 * same cm/360 as `sens` in the source game. DPI cancels out.
 *
 *   sens_B = sens_A × yaw_A / yaw_B
 */
export function convert360(sens: number, fromYaw: number, toYaw: number): number {
  assertPositive('sens', sens)
  assertPositive('fromYaw', fromYaw)
  assertPositive('toYaw', toYaw)
  return (sens * fromYaw) / toYaw
}

/** Inverse of `cmPer360`: the sensitivity that produces the given cm/360. */
export function sensForCmPer360(cm: number, yaw: number, dpi: number): number {
  assertPositive('cm', cm)
  assertPositive('yaw', yaw)
  assertPositive('dpi', dpi)
  return (DEGREES_PER_TURN * CM_PER_INCH) / (cm * dpi * yaw)
}
