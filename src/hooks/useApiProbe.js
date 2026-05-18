/**
 * useApiProbe
 *
 * Calls /api/probe with the live ctx (token + apikey + upstream config) to
 * discover which GDT API endpoints exist. Returns the raw probe results for
 * rendering in a debug panel.
 *
 *   { results, loading, error }
 *
 * Skips entirely in dev mode (mock token).
 */

import { useState, useEffect } from 'react'

const MOCK_TOKEN = 'mock-token-dev-only'

export function useApiProbe(ctx, { enabled = true } = {}) {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const apikey  = ctx?.property?._apikey ?? null
  const token   = ctx?.oauth_token       ?? null
  const origin  = ctx?.api_origin        ?? null
  const base    = ctx?.api_base          ?? ''

  useEffect(() => {
    if (!enabled) return
    if (!apikey || !token) return
    if (token === MOCK_TOKEN) return

    let cancelled = false
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({ property_apikey: apikey })
    if (origin) params.set('api_origin', origin)
    if (base)   params.set('api_base',   base)

    fetch(`/api/probe?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const text = await res.text()
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
        return JSON.parse(text)
      })
      .then((data) => {
        if (!cancelled) setResults(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [apikey, token, origin, base, enabled])

  return { results, loading, error }
}
