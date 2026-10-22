<script lang="ts">
  import type { Game } from '../../data/schema'
  import { games, trustLabels } from './games'

  const ISSUE_URL = 'https://github.com/umut-hope/yawmatch/issues/new?template=add-game.yml'

  const fovTypeLabels: Record<NonNullable<Game['fov']>['type'], string> = {
    horizontal: 'Horizontal',
    vertical: 'Vertical',
    'horizontal-4:3': 'Horizontal (4:3 reference)',
  }

  function describeFov(fov: Game['fov']): string {
    if (!fov) return 'Not documented yet'
    const type = fovTypeLabels[fov.type]
    if (!fov.adjustable) return `${type}, fixed at ${fov.default}°`
    const range = fov.min !== undefined && fov.max !== undefined ? `, ${fov.min}–${fov.max}°` : ''
    return `${type}, default ${fov.default}°${range}`
  }

  const trustHelp: Record<Game['verifiedBy'], string> = {
    official: 'From the developer’s own documentation.',
    measurement: 'Measured in game with a repeatable method.',
    community: 'Several independent sources agree.',
    unverified: 'No source, or sources disagree. Check in game before relying on it.',
  }

  const counts = $derived(
    games.reduce<Record<string, number>>((acc, g) => {
      acc[g.verifiedBy] = (acc[g.verifiedBy] ?? 0) + 1
      return acc
    }, {}),
  )
</script>

<section class="intro">
  <h1>Games database</h1>
  <p>
    Yaw is how many degrees the camera turns per mouse count at sensitivity 1. Every value
    links to where it came from.
  </p>
</section>

<section class="card legend" aria-label="Trust levels">
  <h2>Trust levels</h2>
  <ul>
    {#each Object.keys(trustHelp) as level (level)}
      {@const key = level as Game['verifiedBy']}
      <li>
        <span class="trust trust-{key}">{trustLabels[key]}</span>
        <span class="muted small">{trustHelp[key]} ({counts[key] ?? 0})</span>
      </li>
    {/each}
  </ul>
</section>

<div class="game-list">
  {#each games as game (game.id)}
    <article class="card game" id={game.id}>
      <header class="game-head">
        <h2>{game.name}</h2>
        <span class="trust trust-{game.verifiedBy}">{trustLabels[game.verifiedBy]}</span>
      </header>

      <dl class="facts">
        <div>
          <dt>Yaw</dt>
          <dd><code>{game.yaw}</code> °/count</dd>
        </div>
        <div>
          <dt>Sens curve</dt>
          <dd>{game.sensCurve === 'linear' ? 'Linear' : game.sensCurve}</dd>
        </div>
        <div class="span">
          <dt>FOV</dt>
          <dd>{describeFov(game.fov)}</dd>
        </div>
        <div class="span">
          <dt>Config location</dt>
          <dd>
            {#if game.configFiles.length > 0}
              {#each game.configFiles as file (file)}
                <code class="path">{file}</code>
              {/each}
            {:else}
              <span class="muted">In-game menu only / not documented</span>
            {/if}
          </dd>
        </div>
        <div class="span">
          <dt>Console</dt>
          <dd>
            {#if game.consoleCommand}
              <code>{game.consoleCommand}</code>
            {:else}
              <span class="muted">None</span>
            {/if}
          </dd>
        </div>
      </dl>

      {#if game.notes}
        <p class="game-note">{game.notes}</p>
      {/if}

      <details class="sources">
        <summary>Sources ({game.sources.length})</summary>
        {#if game.sources.length > 0}
          <ul>
            {#each game.sources as source (source.url)}
              <li>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.title ?? source.url}
                </a>
                {#if source.note}<span class="muted small"> · {source.note}</span>{/if}
              </li>
            {/each}
          </ul>
        {:else}
          <p class="muted small">No source yet.</p>
        {/if}
      </details>
    </article>
  {/each}
</div>

<p class="muted small contribute">
  Found a wrong value or have a better source?
  <a href={ISSUE_URL} target="_blank" rel="noopener noreferrer">Suggest a fix or a new game</a>.
</p>
