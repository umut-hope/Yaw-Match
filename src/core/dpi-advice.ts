import { assertPositive, degreesPerCount, edpi } from './convert'

const toDegrees = (rad: number): number => (rad * 180) / Math.PI
const toRadians = (deg: number): number => (deg * Math.PI) / 180

/**
 * Angle covered by one pixel at the centre of the screen, for a given horizontal
 * resolution and horizontal FOV (rectilinear projection).
 */
export function degreesPerCenterPixel(widthPx: number, horizontalFovDeg: number): number {
  assertPositive('widthPx', widthPx)
  if (!(horizontalFovDeg > 0 && horizontalFovDeg < 180)) {
    throw new RangeError(`horizontalFovDeg must be between 0 and 180, got ${horizontalFovDeg}`)
  }
  return toDegrees(Math.atan(Math.tan(toRadians(horizontalFovDeg) / 2) / (widthPx / 2)))
}

/**
 * Default "coarse" threshold, derived rather than chosen: one centre pixel on a
 * 1920 px wide screen at 90° horizontal FOV (≈ 0.0597°). If a single mouse count turns
 * more than this, the crosshair can skip pixels when making the smallest adjustments.
 */
export const DEFAULT_MAX_DEGREES_PER_COUNT = degreesPerCenterPixel(1920, 90)

/** Common mouse DPI presets, tried in ascending order. */
export const DEFAULT_DPI_STEPS: readonly number[] = [400, 800, 1600, 3200]

export interface DpiAdviceOptions {
  /** Degrees per count above which the setup is considered coarse. */
  maxDegreesPerCount?: number
  /** DPI values the player can choose from. */
  dpiSteps?: readonly number[]
}

export interface DpiSuggestion {
  dpi: number
  /** New in-game sens; sens × dpi (eDPI) stays the same as before. */
  sens: number
  edpi: number
  degreesPerCount: number
  currentDegreesPerCount: number
  /** False when even the highest available DPI is still above the threshold. */
  reachesTarget: boolean
}

/**
 * Suggests a higher DPI with proportionally lower sens that keeps eDPI (and therefore
 * cm/360) identical but makes each mouse count a finer step.
 *
 * Returns `null` when the current setup is already fine-grained enough, or when no
 * higher DPI step is available.
 */
export function suggestDpi(
  sens: number,
  dpi: number,
  yaw: number,
  options: DpiAdviceOptions = {},
): DpiSuggestion | null {
  const maxDeg = options.maxDegreesPerCount ?? DEFAULT_MAX_DEGREES_PER_COUNT
  const steps = options.dpiSteps ?? DEFAULT_DPI_STEPS
  assertPositive('maxDegreesPerCount', maxDeg)
  steps.forEach((s) => assertPositive('dpiSteps[]', s))
  assertPositive('dpi', dpi)

  const current = degreesPerCount(sens, yaw)
  if (current <= maxDeg) return null

  const higher = [...steps].filter((s) => s > dpi).sort((a, b) => a - b)
  if (higher.length === 0) return null

  const currentEdpi = edpi(sens, dpi)
  const build = (newDpi: number): DpiSuggestion => {
    const newSens = currentEdpi / newDpi
    const deg = degreesPerCount(newSens, yaw)
    return {
      dpi: newDpi,
      sens: newSens,
      edpi: currentEdpi,
      degreesPerCount: deg,
      currentDegreesPerCount: current,
      reachesTarget: deg <= maxDeg,
    }
  }

  for (const step of higher) {
    const suggestion = build(step)
    if (suggestion.reachesTarget) return suggestion
  }
  // Nothing reaches the threshold: the highest step is still the best improvement.
  return build(higher[higher.length - 1]!)
}
