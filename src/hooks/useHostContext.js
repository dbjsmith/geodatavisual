/**
 * useHostContext
 *
 * Returns the current navigation context supplied by the BlueBox host.
 *
 * In dev mode (no parent iframe), falls back to Thornfield Station mock data
 * so `npm run dev` produces a populated UI without needing a host.
 *
 *   const { ctx, isDev, messageLog } = useHostContext()
 */

import { useEffect, useState } from 'react'
import { MSG, isHostMessage, emitReady } from '../lib/postMessage'
import { mockContext } from '../lib/mockData'

const IN_IFRAME = typeof window !== 'undefined' && window.parent !== window

export function useHostContext() {
  const [ctx, setCtx]               = useState(null)
  const [messageLog, setMessageLog] = useState([])

  useEffect(() => {
    function processMessage(evt) {
      const entry = {
        origin: evt.origin,
        data:   evt.data,
        time:   Date.now(),
      }
      setMessageLog(log => [...log, entry])

      if (!isHostMessage(evt)) return
      const next = evt.data.navigation_context ?? evt.data.context ?? null
      if (next) setCtx(next)
    }

    // ── Drain any messages that arrived before React mounted ─────────────
    const early = window.__gdvEarlyMessages ?? []
    for (const m of early) {
      processMessage({ origin: m.origin, data: m.data })
    }

    // ── Listen for new messages from this point on ───────────────────────
    function onMessage(evt) { processMessage(evt) }
    window.addEventListener('message', onMessage)

    // ── Dev-mode fallback ────────────────────────────────────────────────
    if (!IN_IFRAME) {
      setCtx(mockContext)
    }

    // ── Tell host we're alive (handshake) ────────────────────────────────
    emitReady()

    return () => window.removeEventListener('message', onMessage)
  }, [])

  return {
    ctx,
    isDev:    !IN_IFRAME,
    inIframe: IN_IFRAME,
    messageLog,
  }
}

export { MSG }
