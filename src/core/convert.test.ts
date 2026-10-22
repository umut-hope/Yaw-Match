import { describe, expect, it } from 'vitest'
import {
  CM_PER_INCH,
  cmPer360,
  convert360,
  countsPer360,
  degreesPerCount,
  edpi,
  inchesPer360,
  sensFromCm360,
} from './convert'

// Yaw values here are arbitrary test inputs, not claims about any game.
const YAW_A = 0.022
const YAW_B = 0.07
const YAW_C = 0.0066

const invalid = [0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]

describe('degreesPerCount', () => {
  it('multiplies sens by yaw', () => {
    expect(degreesPerCount(1, YAW_A)).toBeCloseTo(0.022, 12)
    expect(degreesPerCount(2.5, YAW_A)).toBeCloseTo(0.055, 12)
  })

  it.each(invalid)('rejects invalid sens %s', (v) => {
    expect(() => degreesPerCount(v, YAW_A)).toThrow(RangeError)
  })

  it.each(invalid)('rejects invalid yaw %s', (v) => {
    expect(() => degreesPerCount(1, v)).toThrow(RangeError)
  })
})

describe('countsPer360', () => {
  it('returns 360 / (sens × yaw)', () => {
    expect(countsPer360(1, YAW_A)).toBeCloseTo(16363.636363636, 6)
    expect(countsPer360(1, 0.1)).toBeCloseTo(3600, 9)
  })

  it('is inversely proportional to sens', () => {
    expect(countsPer360(2, YAW_A)).toBeCloseTo(countsPer360(1, YAW_A) / 2, 9)
  })

  it('turns exactly 360° when multiplied back', () => {
    const counts = countsPer360(1.37, YAW_A)
    expect(counts * 1.37 * YAW_A).toBeCloseTo(360, 9)
  })
})

describe('inchesPer360 / cmPer360', () => {
  it('computes the reference case (sens 1, yaw 0.022, 800 DPI)', () => {
    expect(inchesPer360(1, YAW_A, 800)).toBeCloseTo(20.454545454545, 9)
    expect(cmPer360(1, YAW_A, 800)).toBeCloseTo(51.954545454545, 9)
  })

  it('converts inches to cm with 2.54', () => {
    const inches = inchesPer360(0.8, YAW_A, 1600)
    expect(cmPer360(0.8, YAW_A, 1600)).toBeCloseTo(inches * CM_PER_INCH, 12)
  })

  it('stays constant when sens × DPI (eDPI) stays constant', () => {
    const base = cmPer360(1, YAW_A, 800)
    expect(cmPer360(2, YAW_A, 400)).toBeCloseTo(base, 9)
    expect(cmPer360(0.5, YAW_A, 1600)).toBeCloseTo(base, 9)
  })

  it('halves when DPI doubles', () => {
    expect(cmPer360(1, YAW_A, 1600)).toBeCloseTo(cmPer360(1, YAW_A, 800) / 2, 9)
  })

  it.each(invalid)('rejects invalid dpi %s', (v) => {
    expect(() => cmPer360(1, YAW_A, v)).toThrow(RangeError)
    expect(() => inchesPer360(1, YAW_A, v)).toThrow(RangeError)
  })
})

describe('edpi', () => {
  it('multiplies sens by DPI', () => {
    expect(edpi(1, 800)).toBe(800)
    expect(edpi(1.25, 1600)).toBe(2000)
    expect(edpi(0.4, 800)).toBeCloseTo(320, 9)
  })

  it.each(invalid)('rejects invalid input %s', (v) => {
    expect(() => edpi(v, 800)).toThrow(RangeError)
    expect(() => edpi(1, v)).toThrow(RangeError)
  })
})

describe('convert360', () => {
  it('applies sens_B = sens_A × yaw_A / yaw_B', () => {
    expect(convert360(1, YAW_A, YAW_B)).toBeCloseTo(0.314285714286, 9)
    expect(convert360(1, YAW_B, YAW_A)).toBeCloseTo(3.181818181818, 9)
  })

  it('returns the same sens when yaw is equal', () => {
    expect(convert360(1.7, YAW_A, YAW_A)).toBeCloseTo(1.7, 12)
  })

  it('preserves cm/360 across games at any DPI', () => {
    for (const dpi of [400, 800, 1600, 3200]) {
      for (const sens of [0.1, 0.75, 1, 2.3, 10]) {
        const target = convert360(sens, YAW_A, YAW_B)
        expect(cmPer360(target, YAW_B, dpi)).toBeCloseTo(cmPer360(sens, YAW_A, dpi), 9)
      }
    }
  })

  it('round-trips back to the original sens', () => {
    const there = convert360(1.234, YAW_A, YAW_C)
    expect(convert360(there, YAW_C, YAW_A)).toBeCloseTo(1.234, 12)
  })

  it('is transitive (A → B → C equals A → C)', () => {
    const viaB = convert360(convert360(0.9, YAW_A, YAW_B), YAW_B, YAW_C)
    expect(viaB).toBeCloseTo(convert360(0.9, YAW_A, YAW_C), 12)
  })

  it.each(invalid)('rejects invalid input %s', (v) => {
    expect(() => convert360(v, YAW_A, YAW_B)).toThrow(RangeError)
    expect(() => convert360(1, v, YAW_B)).toThrow(RangeError)
    expect(() => convert360(1, YAW_A, v)).toThrow(RangeError)
  })
})

describe('sensFromCm360', () => {
  it('is the inverse of cmPer360', () => {
    for (const dpi of [400, 800, 1600]) {
      for (const sens of [0.3, 1, 2.5]) {
        const cm = cmPer360(sens, YAW_A, dpi)
        expect(sensFromCm360(cm, dpi, YAW_A)).toBeCloseTo(sens, 12)
      }
    }
  })

  it('computes the reference case', () => {
    expect(sensFromCm360(51.954545454545, 800, YAW_A)).toBeCloseTo(1, 9)
  })

  it('halves sens when the target cm/360 doubles', () => {
    expect(sensFromCm360(80, 800, YAW_A)).toBeCloseTo(sensFromCm360(40, 800, YAW_A) / 2, 12)
  })

  it('gives the same physical speed in every game', () => {
    const sA = sensFromCm360(35, 1600, YAW_A)
    const sB = sensFromCm360(35, 1600, YAW_B)
    expect(convert360(sA, YAW_A, YAW_B)).toBeCloseTo(sB, 12)
  })

  it.each(invalid)('rejects invalid input %s', (v) => {
    expect(() => sensFromCm360(v, 800, YAW_A)).toThrow(RangeError)
    expect(() => sensFromCm360(40, v, YAW_A)).toThrow(RangeError)
    expect(() => sensFromCm360(40, 800, v)).toThrow(RangeError)
  })
})
