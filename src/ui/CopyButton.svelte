<script lang="ts">
  interface Props {
    text: string
    /** Visible label; defaults to "Copy". */
    label?: string
    /** Show `text` itself on the button (e.g. a console line). */
    showText?: boolean
  }

  let { text, label = 'Copy', showText = false }: Props = $props()
  let status = $state<'idle' | 'copied' | 'failed'>('idle')
  let timer: ReturnType<typeof setTimeout> | undefined

  function fallbackCopy(value: string): boolean {
    const area = document.createElement('textarea')
    area.value = value
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    try {
      return document.execCommand('copy')
    } catch {
      return false
    } finally {
      area.remove()
    }
  }

  async function copy() {
    let ok = false
    try {
      await navigator.clipboard.writeText(text)
      ok = true
    } catch {
      ok = fallbackCopy(text)
    }
    status = ok ? 'copied' : 'failed'
    clearTimeout(timer)
    timer = setTimeout(() => (status = 'idle'), 1500)
  }

  const stateLabel = $derived(status === 'copied' ? 'Copied' : status === 'failed' ? 'Failed' : label)
</script>

<button
  type="button"
  class="copy"
  class:copy-line={showText}
  class:is-copied={status === 'copied'}
  onclick={copy}
  aria-label={showText ? `Copy: ${text}` : undefined}
>
  {#if showText}
    <code class="copy-text">{text}</code>
  {/if}
  <span class="copy-state" aria-live="polite">{stateLabel}</span>
</button>
