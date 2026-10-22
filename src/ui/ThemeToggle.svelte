<script lang="ts">
  import { getStorage } from './settings'

  type Theme = 'system' | 'light' | 'dark'
  const KEY = 'sensfinder.theme'
  const order: Theme[] = ['system', 'light', 'dark']
  const storage = getStorage()

  function read(): Theme {
    try {
      const v = storage?.getItem(KEY)
      return v === 'light' || v === 'dark' ? v : 'system'
    } catch {
      return 'system'
    }
  }

  let theme = $state<Theme>(read())

  $effect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
    try {
      if (theme === 'system') storage?.removeItem(KEY)
      else storage?.setItem(KEY, theme)
    } catch {
      // Not remembered; still applied for this visit.
    }
  })

  function next() {
    theme = order[(order.indexOf(theme) + 1) % order.length] ?? 'system'
  }
</script>

<button type="button" class="theme" onclick={next} title="Switch colour theme">
  Theme: {theme}
</button>

<style>
  .theme {
    padding: 0.35rem 0.7rem;
    font: inherit;
    font-size: 0.85rem;
    color: var(--muted);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
    text-transform: capitalize;
  }
  .theme:hover {
    color: var(--fg);
  }
</style>
