/**
 * useMappingData
 *
 * Fetches spatial data from the GDT mapping endpoint via the /api/mapping
 * Netlify proxy. Forwards api_origin + api_base so the proxy routes to the
 * correct upstream environment.
 *
 * Returns full debug state so the UI can surface what happened on the wire
 * (request URL, status, response body, errors) without needing DevTools.
 *
 *   { mappingData, loading, error, debug }
 *
 * Also publishes debug to window.__gdvMappingDebug for console inspection.
 */

import { useState, useEffect } from 'react'
import { mockMappingData } from '../lib/mockData'

const MOCK_TOKEN = 'mock-token-dev-only'

export function useMappingData(ctx) {
  const [mappingData, setMappingData] = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)
  const [debug, setDebug]             = useState({
    status:         'idle',          // 'idle' | 'skipped' | 'loading' | 'ok' | 'error'
    reason:         null,            // why skipped, or short error label
    requestUrl:     null,
    httpStatus:     null,
    httpStatusText: null,
    responseText:   null,            // first ~2 KB of response body
    fetchError:     null,
    ctxSummary:     null,
  })

  const propertyApikey = ctx?.property?._apikey ?? ctx?.property?.apikey ?? null
  const oauthToken     = ctx?.oauth_token ?? ctx?.token ?? null
  const apiOrigin      = ctx?.api_origin  ?? null
  const apiBase        = ctx?.api_base    ?? ''

  useEffect(() => {
    const ctxSummary = {
      hasPropertyApikey: !!propertyApikey,
      propertyApikey:    propertyApikey ? propertyApikey.slice(0, 8) + '…' : null,
      hasOauthToken:     !!oauthToken,
      oauthTokenPrefix:  oauthToken ? oauthToken.slice(0, 8) + '…' : null,
      apiOrigin,
      apiBase,
    }

    const publish = (next) => {
      const merged = { ...next, ctxSummary }
      setDebug(merged)
      if (typeof window !== 'undefined') window.__gdvMappingDebug = merged
    }

    if (!propertyApikey || !oauthToken) {
      publish({ status: 'skipped', reason: 'missing propertyApikey or oauthToken' })
      return
    }

    // Dev-mode shortcut
    if (oauthToken === MOCK_TOKEN) {
      setMappingData(mockMappingData)
      publish({ status: 'skipped', reason: 'using Thornfield mock (dev mode)' })
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({ property_apikey: propertyApikey })
    if (apiOrigin) params.set('api_origin', apiOrigin)
    if (apiBase)   params.set('api_base',   apiBase)
    const requestUrl = `/api/mapping?${params.toString()}`

    publish({ status: 'loading', requestUrl })

    fetch(requestUrl, {
      headers: { Authorization: `Bearer ${oauthToken}` },
    })
      .then(async (res) => {
        const text = await res.text()
        if (cancelled) return

        if (!res.ok) {
          publish({
            status:         'error',
            requestUrl,
            httpStatus:     res.status,
            httpStatusText: res.statusText,
            responseText:   text.slice(0, 2000),
          })
          let errMsg = `HTTP ${res.status}`
          try {
            const j = JSON.parse(text)
            errMsg = j.error ? `${errMsg} — ${j.error}` : errMsg
          } catch { /* not JSON */ }
          throw new Error(errMsg)
        }

        let json = null
        try {
          json = JSON.parse(text)
        } catch (e) {
          publish({
            status:         'error',
            requestUrl,
            httpStatus:     res.status,
            httpStatusText: res.statusText,
            responseText:   text.slice(0, 2000),
            fetchError:     'response was not JSON',
          })
          throw new Error('response was not JSON')
        }

        setMappingData(json)
        publish({
          status:         'ok',
          requestUrl,
          httpStatus:     res.status,
          httpStatusText: res.statusText,
          responseText:   text.slice(0, 2000),
        })
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
        publish({
          status:     'error',
          requestUrl,
          fetchError: err.message,
        })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [propertyApikey, oauthToken, apiOrigin, apiBase])

  return { mappingData, loading, error, debug }
}
