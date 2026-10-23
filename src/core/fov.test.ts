import { describe, expect, it } from 'vitest'
import { FovType as SchemaFovType } from '../../data/schema'
import {
  FOV_TYPES,
  convertFov,
  fromVerticalFov,
  horizontalFromVertical,
  toVerticalFov,
  verticalFromHorizontal,
} from './fov'

const WIDE = 16 / 9

describe('horizontal / vertical conversion', () => {
  it('matches known values', () => {
    // 90° horizontal at 16:9 is about 58.72° vertical.
    expect(verticalFromHorizontal(90, WIDE)).toBeCloseTo(58.7155, 3)
    // 90° horizontal at 4:3 becomes about 106.26° horizontal at 16:9.
    expect(horizontalFromVertical(verticalFromHorizontal(90, 4 / 3), WIDE)).toBeCloseTo(106.2602, 3)
  })

  it('is the identity at aspect 1 and round-trips at any aspect', () => {
    expect(verticalFromHorizontal(75, 1)).toBeCloseTo(75, 12)
    for (const aspect of [4 / 3, WIDE, 21 / 9, 32 / 9]) {
      for (const h of [60, 90, 103, 120]) {
        expect(horizontalFromVertical(verticalFromHorizontal(h, aspect), aspect)).toBeCloseTo(h, 9)
      }
    }
  })

  it('rejects invalid input', () => {
    expect(() => verticalFromHorizontal(0, WIDE)).toThrow(RangeError)
    expect(() => verticalFromHorizontal(180, WIDE)).toThrow(RangeError)
    expect(() => horizontalFromVertical(60, 0)).toThrow(RangeError)
    expect(() => horizontalFromVertical(Number.NaN, WIDE)).toThrow(RangeError)
  })
})

describe('toVerticalFov / fromVerticalFov', () => {
  it('passes vertical values through', () => {
    expect(toVerticalFov(70, 'vertical', WIDE)).toBe(70)
    expect(fromVerticalFov(70, 'vertical', WIDE)).toBe(70)
  })

  it('uses the real aspect for horizontal values', () => {
    expect(toVerticalFov(90, 'horizontal', WIDE)).toBeCloseTo(verticalFromHorizontal(90, WIDE), 12)
    expect(toVerticalFov(90, 'horizontal', 21 / 9)).toBeLessThan(toVerticalFov(90, 'horizontal', WIDE))
  })

  it('ignores the screen aspect for horizontal-4:3 values', () => {
    const at169 = toVerticalFov(90, 'horizontal-4:3', WIDE)
    expect(toVerticalFov(90, 'horizontal-4:3', 21 / 9)).toBeCloseTo(at169, 12)
    expect(at169).toBeCloseTo(73.7398, 3)
  })

  it.each(FOV_TYPES)('round-trips %s', (type) => {
    for (const aspect of [4 / 3, WIDE, 21 / 9]) {
      expect(fromVerticalFov(toVerticalFov(95, type, aspect), type, aspect)).toBeCloseTo(95, 9)
    }
  })
})

describe('convertFov', () => {
  it('converts a 4:3-referenced value to the real horizontal FOV', () => {
    expect(convertFov(90, 'horizontal-4:3', 'horizontal', WIDE)).toBeCloseTo(106.2602, 3)
  })
})

describe('FOV_TYPES', () => {
  it('matches the game data schema', () => {
    expect([...FOV_TYPES].sort()).toEqual([...SchemaFovType.options].sort())
  })
})
