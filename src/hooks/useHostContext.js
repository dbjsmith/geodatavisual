/**
 * useHostContext
 *
 * Returns the current navigation context supplied by the BlueBox host.
 *
 * In dev mode (no parent iframe), falls back to Thornfield Station mock data
 * so `npm run dev` produces a populated UI without needing a host.
 *
 *   const { ctx, isDev } = useHostContext()
 */

import { useEffect, useState } from 'react'
import { MSG, isHostMessage, emitReady } from '../lib/postMessage'
import { mockContext } from '../lib/mockData'

const IN_IFRAME = typeof window !== 'undefined' && window.parent !== window

export function useHostContext() {
  const [ctx, setCtx] = useState(null)

  useEffect(() => {
    function onMessage(evt) {
      if (!isHostMessage(evt)) return
      const next = evt.data.navigation_context ?? evt.data.context ?? null
      if (next) setCtx(next)
    }

    window.addEventListener('message', onMessage)

    // If we're embedded but the host hasn't sent host:init yet, that's fine —
    // we'll get it on the next message. If we're standalone, fall back to mock.
    if (!IN_IFRAME) {
      setCtx(mockContext)
    }

    // Tell host we're alive
    emitReady()

    return () => window.removeEventListener('message', onMessage)
  }, [])

  return {
    ctx,
    isDev:    !IN_IFRAME,
    inIframe: IN_IFRAME,
  }
}

export { MSG }
