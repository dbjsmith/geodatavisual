/**
 * postMessage protocol with the BlueBox host
 *
 *   host → gdv:    host:init       (initial context)
 *   host → gdv:    host:navigate   (level change)
 *   gdv  → host:   gdv:ready       (emitted after first paint)
 *
 * All messages are JSON. The host's origin is whatever loads the iframe;
 * we don't lock it down here because the BlueBox host runs on multiple
 * domains (prod, dev, customer instances).
 */

export const MSG = {
  HOST_INIT:     'host:init',
  HOST_NAVIGATE: 'host:navigate',
  GDV_READY:     'gdv:ready',
}

/**
 * Send gdv:ready to the parent window — call once after the first level
 * view has mounted so the host knows the iframe is alive.
 */
export function emitReady() {
  if (typeof window === 'undefined' || window.parent === window) return
  try {
    window.parent.postMessage({ type: MSG.GDV_READY }, '*')
  } catch {
    // No-op — host frame may not accept messages during teardown.
  }
}

/**
 * Type guard for incoming host messages.
 */
export function isHostMessage(evt) {
  if (!evt?.data || typeof evt.data !== 'object') return false
  return evt.data.type === MSG.HOST_INIT || evt.data.type === MSG.HOST_NAVIGATE
}
