/**
 * useMappingData
 *
 * Fetches spatial data from the GDT mapping endpoint via the /api/mapping
 * Netlify proxy, using the OAuth token + property apikey supplied by the
 * BlueBox host. Also forwards api_origin + api_base so the proxy can route
 * to the correct upstream environment (dev vs prod).
 *
 * Dev-mode shortcut: when the token is the placeholder used by mockContext,
 * we skip the network call and return Thornfield mock data — keeps
 * `npm run dev` working without a live host.
 *
 * Returns: { mappingData, loading, error }
 */

import { useState, useEffect } from 'react'
import { mockMappingData } from '../lib/mockData'

const MOCK_TOKEN = 'mock-token-dev-only'

export function useMappingData(ctx) {
  const [mappingData, setMappingData] = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)

  const propertyApikey = ctx?.property?._apikey ?? ctx?.property?.apikey ?? null
  const oauthToken     = ctx?.oauth_token ?? ctx?.token ?? null
  const apiOrigin      = ctx?.api_origin  ?? null
  const apiBase        = ctx?.api_base    ?? ''

  useEffect(() => {
    if (!propertyApikey || !oauthToken) return

    // Dev-mode shortcut — no real fetch.
    if (oauthToken === MOCK_TOKEN) {
      setMappingData(mockMappingData)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({ property_apikey: propertyApikey })
    if (apiOrigin) params.set('api_origin', apiOrigin)
    if (apiBase)   params.set('api_base',   apiBase)

    fetch(`/api/mapping?${params.toString()}`, {
      headers: { Authorization: `Bearer ${oauthToken}` },
    })
      .then(res => {
        if (!res.ok) return res.json().then(e => { throw new Error(e.error || res.statusText) })
        return res.json()
      })
      .then(data => {
        if (!cancelled) setMappingData(data)
      })
      .catch(err => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [propertyApikey, oauthToken, apiOrigin, apiBase])

  return { mappingData, loading, error }
}
