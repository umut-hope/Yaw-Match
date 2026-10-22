<script lang="ts">
  import promo from '../promo.json'
  import { dismissPromo, isPromoDismissed } from './prefs'

  let visible = $state(!isPromoDismissed())

  function close() {
    dismissPromo(promo.dismissDays)
    visible = false
  }
</script>

{#if visible}
  <div class="promo">
    <a
      class="promo-link"
      href={promo.href}
      target="_blank"
      rel="noopener"
      aria-label="{promo.label}: {promo.text} (opens in a new tab)"
    >
      <svg class="promo-icon" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.6" />
        <circle cx="10" cy="10" r="2.2" fill="currentColor" />
      </svg>
      <span class="promo-text">
        <span class="promo-label">{promo.label} ·</span>
        {promo.text}
        <span aria-hidden="true">→</span>
      </span>
    </a>
    <button type="button" class="promo-close" onclick={close} aria-label="Hide this for {promo.dismissDays} days">
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
      </svg>
    </button>
  </div>
{/if}
