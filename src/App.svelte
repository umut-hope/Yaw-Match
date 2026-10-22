<script lang="ts">
  import Converter from './ui/Converter.svelte'
  import GamesPage from './ui/GamesPage.svelte'
  import Promo from './ui/Promo.svelte'

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
    document.title = route === 'games' ? 'Games · yawmatch' : 'yawmatch · mouse sensitivity converter'
  })
</script>

<header class="site-header">
  <a class="brand" href="#/">
    <span class="brand-mark" aria-hidden="true"></span>
    <span class="brand-word">yawmatch</span>
  </a>
  <nav class="site-nav" aria-label="Main">
    <a href="#/" aria-current={route === 'converter' ? 'page' : undefined}>Convert</a>
    <a href="#/games" aria-current={route === 'games' ? 'page' : undefined}>Games</a>
  </nav>
  <Promo />
</header>

<main>
  {#if route === 'games'}
    <GamesPage />
  {:else}
    <Converter />
  {/if}
</main>

<footer class="site-footer">
  <p>Nothing leaves your browser.</p>
  <p>Not affiliated with any game publisher. Game names belong to their respective owners.</p>
</footer>
