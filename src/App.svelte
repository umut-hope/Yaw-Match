<script lang="ts">
  import Converter from './ui/Converter.svelte'
  import GamesPage from './ui/GamesPage.svelte'
  import ThemeToggle from './ui/ThemeToggle.svelte'

  type Route = 'converter' | 'games'

  // Hash routing keeps GitHub Pages happy: every page is served from index.html.
  function readRoute(): Route {
    return location.hash.startsWith('#/games') ? 'games' : 'converter'
  }

  let route = $state<Route>(readRoute())

  $effect(() => {
    const onHashChange = () => {
      route = readRoute()
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  })

  $effect(() => {
    document.title = route === 'games' ? 'Games database · Sens Finder' : 'Sens Finder'
  })
</script>

<header class="top">
  <a class="brand" href="#/">
    <span class="logo" aria-hidden="true">◎</span>
    <span>Sens Finder</span>
  </a>
  <nav aria-label="Main">
    <a href="#/" aria-current={route === 'converter' ? 'page' : undefined}>Converter</a>
    <a href="#/games" aria-current={route === 'games' ? 'page' : undefined}>Games</a>
  </nav>
  <ThemeToggle />
</header>

<main>
  {#if route === 'games'}
    <GamesPage />
  {:else}
    <Converter />
  {/if}
</main>

<footer>
  <p>
    Not affiliated with any game publisher. Game names belong to their respective owners.
    Results are a starting point; fine-tune in game.
  </p>
</footer>
