import { describe, expect, it } from 'vitest'
import {
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
  formatNumber,
  fromQuery,
  loadProfile,
  loadSharedProfile,
  parsePositive,
  resolveSettings,
  saveProfile,
  saveSharedProfile,
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

  it('uses a namespaced key', () => {
    expect(STORAGE_KEY).toBe('yawmatch:profile')
  })

  it('migrates a profile saved under the old key', () => {
    const data = new Map<string, string>([[LEGACY_STORAGE_KEY, JSON.stringify(defaults)]])
    const storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    }
    expect(loadProfile(storage)).toEqual(defaults)
    saveProfile(storage, { ...defaults, sens: '2' })
    expect(data.has(LEGACY_STORAGE_KEY)).toBe(false)
    expect(loadProfile(storage).sens).toBe('2')
  })

  it('prefers the new key over the old one', () => {
    const data = new Map<string, string>([
      [STORAGE_KEY, JSON.stringify({ sens: '3' })],
      [LEGACY_STORAGE_KEY, JSON.stringify({ sens: '9' })],
    ])
    expect(loadProfile({ getItem: (k: string) => data.get(k) ?? null }).sens).toBe('3')
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

describe('shared profile', () => {
  const memory = () => {
    const data = new Map<string, string>()
    return {
      data,
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
    }
  }

  it('writes the source game, sens and dpi as numbers', () => {
    const storage = memory()
    saveSharedProfile(storage, { ...defaults, sens: '1,25', dpi: '400' }, known)
    expect(JSON.parse(storage.data.get('shared:profile')!)).toEqual({ dpi: 400, mainGame: 'cs2', sens: 1.25 })
  })

  it('skips incomplete input and unknown games', () => {
    const storage = memory()
    saveSharedProfile(storage, { ...defaults, sens: '' }, known)
    saveSharedProfile(storage, { ...defaults, from: 'nope' }, known)
    expect(storage.data.has('shared:profile')).toBe(false)
  })

  it('reads it back as converter settings', () => {
    const storage = memory()
    storage.setItem('shared:profile', JSON.stringify({ dpi: 1600, mainGame: 'valorant', sens: 0.35 }))
    expect(loadSharedProfile(storage)).toEqual({ from: 'valorant', sens: '0.35', dpi: '1600' })
  })

  it('ignores corrupt or missing data', () => {
    const storage = memory()
    storage.setItem('shared:profile', '{oops')
    expect(loadSharedProfile(storage)).toEqual({})
    expect(loadSharedProfile(undefined)).toEqual({})
  })

  it('wins over our own profile but not over the URL', () => {
    const shared = { from: 'valorant', sens: '0.35', dpi: '1600' }
    const own = { from: 'cs2', to: 'overwatch-2', sens: '2', dpi: '400' }
    expect(resolveSettings([{}, shared, own], defaults, known)).toEqual({ ...shared, to: 'overwatch-2' })
    expect(resolveSettings([{ sens: '9' }, shared, own], defaults, known).sens).toBe('9')
  })
})
