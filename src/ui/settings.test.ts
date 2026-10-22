import { describe, expect, it } from 'vitest'
import {
  STORAGE_KEY,
  formatNumber,
  fromQuery,
  loadProfile,
  parsePositive,
  resolveSettings,
  saveProfile,
  toQuery,
  type Settings,
} from './settings'

const defaults: Settings = { from: 'cs2', to: 'valorant', sens: '1', dpi: '800' }
const known = (id: string) => ['cs2', 'valorant', 'overwatch-2'].includes(id)

describe('parsePositive', () => {
  it.each([
    ['1.2', 1.2],
    ['1,2', 1.2],
    [' 800 ', 800],
    ['.5', 0.5],
    ['2.', 2],
  ])('parses %j', (input, expected) => {
    expect(parsePositive(input)).toBe(expected)
  })

  it.each(['', '0', '-1', 'abc', '1e3', '1.2.3', 'Infinity', '0.0'])('rejects %j', (input) => {
    expect(parsePositive(input)).toBeNull()
  })
})

describe('formatNumber', () => {
  it('trims trailing zeros', () => {
    expect(formatNumber(0.314285714)).toBe('0.3143')
    expect(formatNumber(2)).toBe('2')
    expect(formatNumber(51.9545, 1)).toBe('52')
  })

  it('handles non-finite numbers', () => {
    expect(formatNumber(Number.NaN)).toBe('–')
  })
})

describe('query string', () => {
  it('round-trips settings', () => {
    const s: Settings = { from: 'cs2', to: 'overwatch-2', sens: '1.2', dpi: '800' }
    expect(fromQuery(toQuery(s))).toEqual(s)
  })

  it('writes a comma decimal as a dot', () => {
    expect(toQuery({ from: 'cs2', to: 'valorant', sens: '2,5', dpi: '800' })).toBe(
      '?from=cs2&to=valorant&sens=2.5&dpi=800',
    )
  })

  it('reads the documented share format', () => {
    expect(fromQuery('?from=cs2&sens=1.2&dpi=800')).toEqual({ from: 'cs2', sens: '1.2', dpi: '800' })
  })

  it('ignores unknown keys, empty and oversized values', () => {
    expect(fromQuery(`?x=1&sens=&dpi=${'9'.repeat(40)}`)).toEqual({})
  })
})

describe('profile storage', () => {
  const memory = () => {
    const data = new Map<string, string>()
    return {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
    }
  }

  it('saves and loads a profile', () => {
    const storage = memory()
    saveProfile(storage, defaults)
    expect(loadProfile(storage)).toEqual(defaults)
  })

  it('survives storage that throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('quota')
      },
    }
    expect(() => saveProfile(broken, defaults)).not.toThrow()
    expect(loadProfile(broken)).toEqual({})
  })

  it('survives missing storage and corrupt data', () => {
    expect(loadProfile(undefined)).toEqual({})
    const storage = memory()
    storage.setItem(STORAGE_KEY, '{not json')
    expect(loadProfile(storage)).toEqual({})
    storage.setItem(STORAGE_KEY, JSON.stringify({ sens: 5, dpi: '400' }))
    expect(loadProfile(storage)).toEqual({ dpi: '400' })
  })
})

describe('resolveSettings', () => {
  it('prefers URL over profile over defaults', () => {
    const result = resolveSettings([{ sens: '2' }, { sens: '3', dpi: '1600' }], defaults, known)
    expect(result).toEqual({ ...defaults, sens: '2', dpi: '1600' })
  })

  it('skips unknown game ids', () => {
    const result = resolveSettings([{ from: 'nope' }, { from: 'overwatch-2' }], defaults, known)
    expect(result.from).toBe('overwatch-2')
    expect(resolveSettings([{ to: 'nope' }], defaults, known).to).toBe('valorant')
  })
})
