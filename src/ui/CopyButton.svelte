<script lang="ts">
  interface Props {
    text: string
    label?: string
  }

  let { text, label = 'Copy' }: Props = $props()
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
</script>

<button type="button" class="copy" class:done={status === 'copied'} onclick={copy} aria-live="polite">
  {status === 'copied' ? 'Copied' : status === 'failed' ? 'Failed' : label}
</button>

<style>
  .copy {
    flex: none;
    min-width: 4.75rem;
    padding: 0.35rem 0.7rem;
    font: inherit;
    font-size: 0.85rem;
    color: var(--fg);
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
  }
  .copy:hover {
    border-color: var(--accent);
  }
  .copy.done {
    color: var(--accent-fg);
    background: var(--accent);
    border-color: var(--accent);
  }
</style>
