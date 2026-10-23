import { describe, expect, it } from 'vitest'
import { SHARED_PROFILE_KEY, parseSharedProfile, serializeSharedProfile } from './shared-profile'

describe('shared profile', () => {
  it('uses the shared key', () => {
    expect(SHARED_PROFILE_KEY).toBe('shared:profile')
  })

  it('round-trips a valid profile', () => {
    const p = { dpi: 800, mainGame: 'cs2', sens: 1.25 }
    expect(parseSharedProfile(serializeSharedProfile(p))).toEqual(p)
  })

  it('drops unknown fields', () => {
    expect(parseSharedProfile(JSON.stringify({ dpi: 400, mainGame: 'valorant', sens: 0.4, extra: 1 }))).toEqual({
      dpi: 400,
      mainGame: 'valorant',
      sens: 0.4,
    })
  })

  it.each([
    null,
    '',
    '{not json',
    JSON.stringify({ dpi: '800', mainGame: 'cs2', sens: 1 }),
    JSON.stringify({ dpi: 800, mainGame: 'CS 2', sens: 1 }),
    JSON.stringify({ dpi: 800, mainGame: 'cs2', sens: 0 }),
    JSON.stringify({ dpi: 800, mainGame: 'cs2' }),
  ])('rejects %s', (raw) => {
    expect(parseSharedProfile(raw)).toBeNull()
  })

  it('refuses to serialise an invalid profile', () => {
    expect(serializeSharedProfile({ dpi: -1, mainGame: 'cs2', sens: 1 })).toBeNull()
  })
})
