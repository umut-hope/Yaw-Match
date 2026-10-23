import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

const GAMES_DIR = join(import.meta.dirname, 'data', 'games')
const GAMES_FILE = 'data/games.json'

/** All game files as one JSON array, sorted by name. Validated by the test suite. */
function gamesJson(): string {
  const games = readdirSync(GAMES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(GAMES_DIR, f), 'utf8')) as { name: string })
    .sort((a, b) => a.name.localeCompare(b.name))
  return JSON.stringify(games)
}

/** Publishes the game list for other sites (such as aimtune) to fetch at runtime. */
function publishGames(): Plugin {
  return {
    name: 'publish-games',
    configureServer(server) {
      server.middlewares.use(`${server.config.base}${GAMES_FILE}`, (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(gamesJson())
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: GAMES_FILE, source: gamesJson() })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/Yaw-Match/',
  plugins: [svelte(), publishGames()],
  test: {
    include: ['src/**/*.test.ts', 'data/**/*.test.ts'],
    environment: 'node',
  },
})
