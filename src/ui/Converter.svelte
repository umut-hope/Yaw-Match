<script lang="ts">
  import { cmPer360, convert360, edpi } from '../core/convert'
  import CopyButton from './CopyButton.svelte'
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
  const target = $derived(findGame(settings.to) ?? firstGame)
  const sens = $derived(parsePositive(settings.sens))
  const dpi = $derived(parsePositive(settings.dpi))

  const result = $derived.by(() => {
    if (sens === null || dpi === null) return null
    const rows = games.map((game) => {
      const value = formatNumber(convert360(sens, source.yaw, game.yaw))
      return { game, sens: value, edpi: formatNumber(edpi(Number(value), dpi), 1), line: configLine(game, value) }
    })
    return {
      cm: cmPer360(sens, source.yaw, dpi),
      sourceEdpi: edpi(sens, dpi),
      target: rows.find((r) => r.game.id === target.id),
      rows,
    }
  })

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

  function swap() {
    settings = { ...settings, from: settings.to, to: settings.from }
  }
</script>

<section class="intro">
  <h1>Convert your mouse sensitivity</h1>
  <p>Keep the same physical feel (cm/360) when you switch games. Everything runs in your browser.</p>
</section>

<section class="card form" aria-label="Your settings">
  <div class="field wide">
    <label for="from">From game</label>
    <select id="from" bind:value={settings.from}>
      {#each games as game (game.id)}
        <option value={game.id}>{game.name}</option>
      {/each}
    </select>
  </div>

  <div class="field">
    <label for="sens">Sensitivity</label>
    <input
      id="sens"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      bind:value={settings.sens}
      aria-invalid={sens === null}
    />
  </div>

  <div class="field">
    <label for="dpi">Mouse DPI</label>
    <input
      id="dpi"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      bind:value={settings.dpi}
      aria-invalid={dpi === null}
    />
  </div>

  <div class="field wide to-row">
    <div class="grow">
      <label for="to">To game</label>
      <select id="to" bind:value={settings.to}>
        {#each games as game (game.id)}
          <option value={game.id}>{game.name}</option>
        {/each}
      </select>
    </div>
    <button type="button" class="swap" onclick={swap} title="Swap games" aria-label="Swap from and to games">⇅</button>
  </div>

  {#if sens === null || dpi === null}
    <p class="error wide" role="alert">Enter a sensitivity and DPI greater than 0.</p>
  {/if}
</section>

{#if result}
  <section class="card result" aria-live="polite">
    <p class="label">{target.name} sensitivity</p>
    <p class="big">{result.target?.sens}</p>
    {#if result.target}
      <div class="line">
        <code>{result.target.line}</code>
        <CopyButton text={result.target.line} />
      </div>
    {/if}
    <dl class="stats">
      <div>
        <dt>cm/360</dt>
        <dd>{formatNumber(result.cm, 2)} cm</dd>
      </div>
      <div>
        <dt>in/360</dt>
        <dd>{formatNumber(result.cm / 2.54, 2)} in</dd>
      </div>
      <div>
        <dt>eDPI ({source.name})</dt>
        <dd>{formatNumber(result.sourceEdpi, 1)}</dd>
      </div>
      <div>
        <dt>eDPI ({target.name})</dt>
        <dd>{result.target?.edpi}</dd>
      </div>
    </dl>
    {#if target.verifiedBy === 'unverified'}
      <p class="note">
        The yaw value for {target.name} is not verified yet. Double-check in game.
        {#if target.notes}{target.notes}{/if}
        <a href="#/games">See sources</a>
      </p>
    {:else if target.notes}
      <p class="game-note">{target.notes}</p>
    {/if}
    <div class="share">
      <span class="muted">Share these settings</span>
      <CopyButton text={shareUrl} label="Copy link" />
    </div>
  </section>

  <section class="card">
    <h2>All games</h2>
    <p class="muted small">
      Equivalents of {formatNumber(sens ?? 0)} in {source.name} at {formatNumber(dpi ?? 0, 0)} DPI
      ({formatNumber(result.cm, 2)} cm/360).
    </p>
    <table class="games">
      <thead>
        <tr>
          <th scope="col">Game</th>
          <th scope="col">Sens</th>
          <th scope="col">eDPI</th>
          <th scope="col">Console / config</th>
        </tr>
      </thead>
      <tbody>
        {#each result.rows as row (row.game.id)}
          <tr class:current={row.game.id === source.id}>
            <th scope="row">
              {row.game.name}
              <span class="trust trust-{row.game.verifiedBy}">{trustLabels[row.game.verifiedBy]}</span>
            </th>
            <td data-label="Sens" class="num">{row.sens}</td>
            <td data-label="eDPI" class="num">{row.edpi}</td>
            <td data-label="Config" class="cfg">
              <div class="line">
                <code>{row.line}</code>
                <CopyButton text={row.line} />
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>
{/if}
