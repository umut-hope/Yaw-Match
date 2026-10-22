import type { Game } from '../../data/schema'

// Game files are validated against the Zod schema by the test suite in CI,
// so the browser bundle only needs the type, not the validator.
const files = import.meta.glob<{ default: Game }>('../../data/games/*.json', { eager: true })

/** All games, sorted by name. */
export const games: readonly Game[] = Object.values(files)
  .map((mod) => mod.default)
  .sort((a, b) => a.name.localeCompare(b.name))

const byId = new Map(games.map((g) => [g.id, g]))

export function findGame(id: string): Game | undefined {
  return byId.get(id)
}

/** The line a player pastes into the console/config, or the bare value if there is none. */
export function configLine(game: Game, sens: string): string {
  return game.consoleCommand ? game.consoleCommand.replaceAll('{sens}', sens) : sens
}

export const trustLabels: Record<Game['verifiedBy'], string> = {
  official: 'Official',
  measurement: 'Measured',
  community: 'Community',
  unverified: 'Unverified',
}
