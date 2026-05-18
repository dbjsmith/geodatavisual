/**
 * useMappingData
 *
 * Fetches real spatial data from the GDT /oauth/mapping endpoint
 * (via the /api/mapping Netlify proxy) using the OAuth token and
 * property_apikey supplied by the BlueBox host via postMessage.
 *
 * Dev-mode fallback:
 *   When the token looks like the dev placeholder ('mock-token-dev-only')
 *   we skip the network call and return Thornfield mock data so
 *   `npm run dev` works without a live BlueBox host.
 *
 * Returns:
 *   { mappingData, loading, error }
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

    fetch(`/api/mapping?property_apikey=${encodeURIComponent(propertyApikey)}`, {
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
  }, [propertyApikey, oauthToken])

  return { mappingData, loading, error }
}
