import { describe, expect, it } from 'vitest'
import { Game } from './schema'

const gameFiles = import.meta.glob<{ default: unknown }>('./games/*.json', { eager: true })

const valid = {
  id: 'example-game',
  name: 'Example Game',
  yaw: 0.022,
  sensCurve: 'linear',
  fov: { default: 90, type: 'horizontal-4:3', adjustable: false },
  ads: null,
  configFiles: ['config.cfg'],
  consoleCommand: 'sensitivity {sens}',
  sources: [{ url: 'https://example.com/yaw' }],
  verifiedBy: 'official',
}

describe('game data files', () => {
  const entries = Object.entries(gameFiles)

  it('has at least one game', () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  it.each(entries)('%s matches the schema', (_path, mod) => {
    const result = Game.safeParse(mod.default)
    expect(result.success, JSON.stringify(result.error?.issues, null, 2)).toBe(true)
  })

  it.each(entries)('%s has an id matching its filename', (path, mod) => {
    const fileId = path.replace(/^.*\/(.+)\.json$/, '$1')
    expect(Game.parse(mod.default).id).toBe(fileId)
  })

  it('has unique ids', () => {
    const ids = entries.map(([, mod]) => Game.parse(mod.default).id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('Game schema', () => {
  it('accepts a valid entry', () => {
    expect(Game.safeParse(valid).success).toBe(true)
  })

  it('accepts an unverified entry without sources', () => {
    expect(Game.safeParse({ ...valid, sources: [], verifiedBy: 'unverified' }).success).toBe(true)
  })

  it('requires a source unless unverified', () => {
    for (const verifiedBy of ['official', 'measurement', 'community']) {
      expect(Game.safeParse({ ...valid, sources: [], verifiedBy }).success).toBe(false)
    }
  })

  it.each([0, -0.022, Number.POSITIVE_INFINITY])('rejects yaw %s', (yaw) => {
    expect(Game.safeParse({ ...valid, yaw }).success).toBe(false)
  })

  it.each(['CS2', 'cs 2', 'cs_2', '-cs2', ''])('rejects id %j', (id) => {
    expect(Game.safeParse({ ...valid, id }).success).toBe(false)
  })

  it('requires {sens} in consoleCommand', () => {
    expect(Game.safeParse({ ...valid, consoleCommand: 'sensitivity 1' }).success).toBe(false)
    expect(Game.safeParse({ ...valid, consoleCommand: null }).success).toBe(true)
  })

  it('rejects unknown FOV types and out-of-range FOV', () => {
    expect(Game.safeParse({ ...valid, fov: { ...valid.fov, type: 'diagonal' } }).success).toBe(false)
    expect(Game.safeParse({ ...valid, fov: { ...valid.fov, default: 180 } }).success).toBe(false)
    expect(
      Game.safeParse({ ...valid, fov: { ...valid.fov, adjustable: true, min: 100, max: 80 } }).success,
    ).toBe(false)
  })

  it('rejects unknown sensCurve, verifiedBy and extra fields', () => {
    expect(Game.safeParse({ ...valid, sensCurve: 'quadratic' }).success).toBe(false)
    expect(Game.safeParse({ ...valid, verifiedBy: 'trust-me' }).success).toBe(false)
    expect(Game.safeParse({ ...valid, extra: true }).success).toBe(false)
  })

  it('rejects invalid source URLs', () => {
    expect(Game.safeParse({ ...valid, sources: [{ url: 'not a url' }] }).success).toBe(false)
  })

  it('allows an unresearched FOV and optional notes', () => {
    expect(Game.safeParse({ ...valid, fov: null, notes: 'Sources disagree.' }).success).toBe(true)
    expect(Game.safeParse({ ...valid, notes: '' }).success).toBe(false)
  })

  it('validates ADS multiplier', () => {
    expect(Game.safeParse({ ...valid, ads: { multiplier: 1 } }).success).toBe(true)
    expect(Game.safeParse({ ...valid, ads: { multiplier: 0 } }).success).toBe(false)
  })
})
