import { describe, expect, it } from 'vitest'
import { cmPer360 } from './convert'
import {
  DEFAULT_MAX_DEGREES_PER_COUNT,
  degreesPerCenterPixel,
  suggestDpi,
} from './dpi-advice'

// Arbitrary test yaw, not a claim about any game.
const YAW = 0.022

describe('degreesPerCenterPixel', () => {
  it('matches atan(tan(fov/2) / (width/2))', () => {
    expect(degreesPerCenterPixel(1920, 90)).toBeCloseTo((Math.atan(1 / 960) * 180) / Math.PI, 12)
  })

  it('gets finer with more pixels and narrower FOV', () => {
    expect(degreesPerCenterPixel(2560, 90)).toBeLessThan(degreesPerCenterPixel(1920, 90))
    expect(degreesPerCenterPixel(1920, 70)).toBeLessThan(degreesPerCenterPixel(1920, 90))
  })

  it.each([0, 180, -10, Number.NaN])('rejects invalid FOV %s', (fov) => {
    expect(() => degreesPerCenterPixel(1920, fov)).toThrow(RangeError)
  })

  it('rejects invalid width', () => {
    expect(() => degreesPerCenterPixel(0, 90)).toThrow(RangeError)
  })
})

describe('DEFAULT_MAX_DEGREES_PER_COUNT', () => {
  it('is about 0.0597°', () => {
    expect(DEFAULT_MAX_DEGREES_PER_COUNT).toBeCloseTo(0.05968, 4)
  })
})

describe('suggestDpi', () => {
  it('returns null when the current setup is already fine', () => {
    // 2 × 0.022 = 0.044° per count, below the threshold.
    expect(suggestDpi(2, 800, YAW)).toBeNull()
  })

  it('returns null exactly at the threshold', () => {
    expect(suggestDpi(1, 800, YAW, { maxDegreesPerCount: 0.022 })).toBeNull()
  })

  it('suggests the smallest higher DPI that fixes a coarse setup', () => {
    // 3 × 0.022 = 0.066° per count at 400 DPI: too coarse. 800 DPI at 1.5 → 0.033°.
    const s = suggestDpi(3, 400, YAW)
    expect(s).not.toBeNull()
    expect(s!.dpi).toBe(800)
    expect(s!.sens).toBeCloseTo(1.5, 12)
    expect(s!.degreesPerCount).toBeCloseTo(0.033, 12)
    expect(s!.currentDegreesPerCount).toBeCloseTo(0.066, 12)
    expect(s!.reachesTarget).toBe(true)
  })

  it('keeps eDPI and cm/360 identical', () => {
    const s = suggestDpi(5, 400, YAW)!
    expect(s.edpi).toBeCloseTo(2000, 9)
    expect(s.sens * s.dpi).toBeCloseTo(5 * 400, 9)
    expect(cmPer360(s.sens, YAW, s.dpi)).toBeCloseTo(cmPer360(5, YAW, 400), 9)
  })

  it('skips steps that are still too coarse', () => {
    // 12 × 0.022 = 0.264°: 800 → 0.132, 1600 → 0.066, 3200 → 0.033.
    const s = suggestDpi(12, 400, YAW)!
    expect(s.dpi).toBe(3200)
    expect(s.reachesTarget).toBe(true)
  })

  it('returns the best available step when none reaches the target', () => {
    // 40 × 0.022 = 0.88° at 400 DPI; even 3200 gives 0.11°.
    const s = suggestDpi(40, 400, YAW)!
    expect(s.dpi).toBe(3200)
    expect(s.reachesTarget).toBe(false)
    expect(s.degreesPerCount).toBeLessThan(s.currentDegreesPerCount)
  })

  it('returns null when there is no higher DPI step', () => {
    expect(suggestDpi(10, 3200, YAW)).toBeNull()
  })

  it('handles a current DPI between presets', () => {
    // 1000 DPI → next step is 1600.
    const s = suggestDpi(4, 1000, YAW)!
    expect(s.dpi).toBe(1600)
    expect(s.sens).toBeCloseTo(2.5, 12)
  })

  it('respects custom options', () => {
    const s = suggestDpi(2, 800, YAW, { maxDegreesPerCount: 0.03, dpiSteps: [6400, 1200] })!
    expect(s.dpi).toBe(1200)
    expect(s.degreesPerCount).toBeCloseTo((2 * 800 * YAW) / 1200, 12)
  })

  it.each([0, -1, Number.NaN])('rejects invalid input %s', (v) => {
    expect(() => suggestDpi(v, 800, YAW)).toThrow(RangeError)
    expect(() => suggestDpi(1, v, YAW)).toThrow(RangeError)
    expect(() => suggestDpi(1, 800, v)).toThrow(RangeError)
    expect(() => suggestDpi(1, 800, YAW, { maxDegreesPerCount: v })).toThrow(RangeError)
    expect(() => suggestDpi(1, 800, YAW, { dpiSteps: [v] })).toThrow(RangeError)
  })
})
