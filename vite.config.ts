import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  base: '/Yaw-Match/',
  plugins: [svelte()],
  test: {
    include: ['src/**/*.test.ts', 'data/**/*.test.ts'],
    environment: 'node',
  },
})
