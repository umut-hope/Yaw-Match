<script lang="ts">
  import { cmPer360, convert360, edpi } from '../core/convert'
  import { suggestDpi } from '../core/dpi-advice'
  import CopyButton from './CopyButton.svelte'
  import Ruler from './Ruler.svelte'
  import { configLine, findGame, games, trustLabels } from './games'
  import {
    formatNumber,
    fromQuery,
    getStorage,
    loadProfile,
    parsePositive,
    resolveSettings,
    saveProfile,
    toQuery,
    type Settings,
  } from './settings'

  const storage = getStorage()
  const firstGame = games[0]
  if (!firstGame) throw new Error('No games in the database')

  const defaults: Settings = {
    from: findGame('cs2') ? 'cs2' : firstGame.id,
    to: games.find((g) => g.id !== 'cs2')?.id ?? firstGame.id,
    sens: '1',
    dpi: '800',
  }

  let settings = $state<Settings>(
    resolveSettings([fromQuery(location.search), loadProfile(storage)], defaults, (id) => !!findGame(id)),
  )

  const source = $derived(findGame(settings.from) ?? firstGame)
  const sens = $derived(parsePositive(settings.sens))
  const dpi = $derived(parsePositive(settings.dpi))
  const valid = $derived(sens !== null && dpi !== null)

  const cm = $derived(sens !== null && dpi !== null ? cmPer360(sens, source.yaw, dpi) : null)
  const eDpi = $derived(sens !== null && dpi !== null ? edpi(sens, dpi) : null)
  const dpiTip = $derived(sens !== null && dpi !== null ? suggestDpi(sens, dpi, source.yaw) : null)

  const cards = $derived(
    sens === null
      ? []
      : games
          .filter((game) => game.id !== source.id)
          .map((game) => {
            const value = formatNumber(convert360(sens, source.yaw, game.yaw))
            return { game, sens: value, line: configLine(game, value) }
          }),
  )

  let shareUrl = $state('')

  $effect(() => {
    const snapshot = { ...settings }
    try {
      history.replaceState(null, '', toQuery(snapshot) + location.hash)
    } catch {
      // Some sandboxed frames block history updates.
    }
    shareUrl = location.href
    saveProfile(storage, snapshot)
  })
</script>

<section class="hero">
  <h1>
    One full turn =
    <span class="hero-value">{cm === null ? '–' : `${formatNumber(cm, 1)} cm`}</span>
    on your mousepad.
  </h1>
  <p class="hero-sub">
    Sensitivity is a distance. Match it, and your aim feels the same in every game.
  </p>
</section>

<Ruler {cm} />

<div class="workspace">
  <div class="workspace-side">
    <section class="card form-card" aria-label="Your settings">
      <div class="field">
        <label for="from">Game</label>
        <select id="from" bind:value={settings.from}>
          {#each games as game (game.id)}
            <option value={game.id}>{game.name}</option>
          {/each}
        </select>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="sens">Sensitivity</label>
          <input
            id="sens"
            class="num-input"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            bind:value={settings.sens}
            aria-invalid={sens === null}
          />
        </div>
        <div class="field">
          <label for="dpi">DPI</label>
          <input
            id="dpi"
            class="num-input"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            bind:value={settings.dpi}
            aria-invalid={dpi === null}
          />
        </div>
      </div>

      {#if !valid}
        <p class="form-error" role="alert">Enter a sensitivity and DPI greater than 0.</p>
      {:else}
        <dl class="mini-stats">
          <div>
            <dt>eDPI</dt>
            <dd>{formatNumber(eDpi ?? 0, 1)}</dd>
          </div>
          <div>
            <dt>cm/360</dt>
            <dd>{formatNumber(cm ?? 0, 2)}</dd>
          </div>
          <div>
            <dt>in/360</dt>
            <dd>{formatNumber((cm ?? 0) / 2.54, 2)}</dd>
          </div>
        </dl>
        <div class="share-row">
          <span>Share these settings</span>
          <CopyButton text={shareUrl} label="Copy link" />
        </div>
      {/if}
    </section>

    {#if dpiTip}
      <aside class="tip" aria-label="DPI tip">
        <p class="tip-title">DPI tip</p>
        <p>
          Try <span class="num">{formatNumber(dpiTip.dpi, 0)} DPI</span> at
          <span class="num">{formatNumber(dpiTip.sens)}</span> sens. Same feel (eDPI
          <span class="num">{formatNumber(dpiTip.edpi, 1)}</span>), but each mouse count turns
          <span class="num">{formatNumber(dpiTip.degreesPerCount, 4)}°</span> instead of
          <span class="num">{formatNumber(dpiTip.currentDegreesPerCount, 4)}°</span>, so small
          adjustments are smoother.
        </p>
        {#if !dpiTip.reachesTarget}
          <p class="tip-more">Even higher DPI would help further if your mouse supports it.</p>
        {/if}
      </aside>
    {/if}
  </div>

  <section class="results" aria-label="Equivalent sensitivity in other games">
    <h2 class="results-title">
      Same <span class="num">{cm === null ? '–' : `${formatNumber(cm, 1)} cm`}</span> in other games
    </h2>
    {#if valid}
      <ul class="game-cards">
        {#each cards as card (card.game.id)}
          <li class="card game-card">
            <div class="game-card-head">
              <h3>{card.game.name}</h3>
              {#if card.game.verifiedBy === 'unverified'}
                <a
                  class="badge badge-warn"
                  href="#/games"
                  aria-label="{card.game.name} yaw is unverified, see sources"
                >
                  {trustLabels.unverified}
                </a>
              {/if}
            </div>
            <p class="game-card-sens num">{card.sens}</p>
            <CopyButton text={card.line} showText />
          </li>
        {/each}
      </ul>
    {:else}
      <p class="muted">Results appear once sensitivity and DPI are valid.</p>
    {/if}
  </section>
</div>
