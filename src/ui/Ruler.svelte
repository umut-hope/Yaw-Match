<script lang="ts">
  import { formatNumber } from './settings'
  import { DEFAULT_PAD_WIDTH_CM, isValidPadWidth, loadPadWidth, savePadWidth } from './prefs'

  interface Props {
    /** cm per 360°, or null while the input is invalid. */
    cm: number | null
  }

  let { cm }: Props = $props()

  const BASE_SCALE_CM = 60
  const MAX_SCALE_CM = 200 // keeps absurd inputs from drawing a kilometre-long ruler
  const MIN_PX_PER_CM = 12
  const SIDE = 18 // room for the first and last label

  let viewport = $state<HTMLDivElement>()
  let viewportWidth = $state(0)

  const scaleMax = $derived(
    cm === null
      ? BASE_SCALE_CM
      : Math.min(MAX_SCALE_CM, Math.max(BASE_SCALE_CM, Math.ceil(cm / 10) * 10)),
  )
  const pxPerCm = $derived(Math.max(MIN_PX_PER_CM, (viewportWidth - SIDE * 2) / scaleMax))
  const trackWidth = $derived(scaleMax * pxPerCm)
  const offScale = $derived(cm !== null && cm > MAX_SCALE_CM)
  const barWidth = $derived(cm === null ? 0 : Math.min(cm, scaleMax) * pxPerCm)

  const ticks = $derived(
    Array.from({ length: scaleMax + 1 }, (_, i) => ({
      x: i * pxPerCm,
      size: i % 10 === 0 ? 'major' : i % 5 === 0 ? 'mid' : 'minor',
      label: i % 10 === 0 ? (i === scaleMax ? `${i} cm` : String(i)) : null,
    })),
  )

  // Keep the end of the bar in view when the ruler scrolls (phones).
  // The first jump is instant: a smooth scroll during page load gets cancelled.
  let hasScrolled = false
  $effect(() => {
    const end = barWidth + SIDE
    if (!viewport || viewportWidth === 0) return
    const { scrollLeft, clientWidth } = viewport
    if (end > scrollLeft + clientWidth - 40 || end < scrollLeft + 40) {
      viewport.scrollTo({
        left: Math.max(0, end - clientWidth * 0.6),
        behavior: hasScrolled ? 'smooth' : 'auto',
      })
    }
    hasScrolled = true
  })

  // Mousepad check
  const savedPad = loadPadWidth()
  let padWidth = $state(savedPad ?? DEFAULT_PAD_WIDTH_CM)
  let padIsAssumed = $state(savedPad === null)
  let editingPad = $state(false)
  let padInput = $state(String(savedPad ?? DEFAULT_PAD_WIDTH_CM))
  let padError = $state(false)

  const halfTurn = $derived(cm === null ? null : cm / 2)
  const padFits = $derived(halfTurn !== null && halfTurn <= padWidth)

  function savePad(event: SubmitEvent) {
    event.preventDefault()
    const value = Number(padInput.trim().replace(',', '.'))
    if (!isValidPadWidth(value)) {
      padError = true
      return
    }
    padError = false
    padWidth = value
    padIsAssumed = false
    editingPad = false
    savePadWidth(value)
  }
</script>

<section class="ruler-panel" aria-label="Your turn distance on a ruler">
  <div class="ruler-viewport" bind:this={viewport} bind:clientWidth={viewportWidth}>
    <div class="ruler" style:width="{trackWidth + SIDE * 2}px" style:--side="{SIDE}px">
      <div class="ruler-labels" aria-hidden="true">
        <span class="ruler-zero">0°</span>
        {#if cm !== null}
          <span
            class="ruler-end-label"
            class:flip={barWidth < 140}
            style:left="{SIDE + barWidth}px"
          >
            360° · {formatNumber(cm, 1)} cm{offScale ? ' →' : ''}
          </span>
        {/if}
      </div>

      <div class="ruler-track">
        <div class="ruler-bar" style:width="{barWidth}px"></div>
        {#if cm !== null}
          <div class="ruler-marker" style:left="{barWidth}px"></div>
        {/if}
        {#if padWidth <= scaleMax}
          <div class="ruler-pad" style:left="{padWidth * pxPerCm}px">
            <span>pad</span>
          </div>
        {/if}
      </div>

      <svg class="ruler-scale" width={trackWidth + SIDE * 2} height="44" aria-hidden="true">
        <g transform="translate({SIDE} 0)">
          {#each ticks as tick (tick.x)}
            <line
              x1={tick.x}
              x2={tick.x}
              y1="0"
              y2={tick.size === 'major' ? 18 : tick.size === 'mid' ? 12 : 7}
              class="tick tick-{tick.size}"
            />
            {#if tick.label}
              <text x={tick.x} y="34" text-anchor={tick.x === 0 ? 'start' : 'middle'}>{tick.label}</text>
            {/if}
          {/each}
        </g>
      </svg>
    </div>
  </div>

  {#if halfTurn !== null}
    <div class="pad-check">
      {#if editingPad}
        <form class="pad-form" onsubmit={savePad}>
          <label for="pad-width">Pad width (cm)</label>
          <input
            id="pad-width"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            bind:value={padInput}
            aria-invalid={padError}
          />
          <button type="submit" class="btn btn-primary">Save</button>
          <button type="button" class="btn" onclick={() => (editingPad = false)}>Cancel</button>
          {#if padError}
            <p class="pad-error" role="alert">Enter a width between 10 and 200 cm.</p>
          {/if}
        </form>
      {:else}
        <p>
          Your pad: <span class="num">{formatNumber(padWidth, 1)} cm</span> wide{padIsAssumed ? ' (assumed)' : ''}.
          A 180° turn needs <span class="num">{formatNumber(halfTurn, 1)} cm</span>,
          {#if padFits}
            which fits on your pad.
          {:else}
            more than your pad, so you will have to lift the mouse.
          {/if}
          <button type="button" class="link-button" onclick={() => (editingPad = true)}>Change pad size</button>
        </p>
      {/if}
    </div>
  {/if}
</section>
