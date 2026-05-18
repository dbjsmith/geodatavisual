/**
 * useSurveyTimeline
 *
 * Given the current ctx and mappingData, fans out parallel calls to
 * `/api/surveys?point_apikey=…` for every monitoring point in the
 * property. Returns:
 *
 *   { rows, loading, error, debug }
 *
 * Where `rows` is one entry per point:
 *
 *   [
 *     {
 *       point:    { _apikey, name, area_name, … },
 *       surveys:  [ { _id, _apikey, type, date, dateISO, name, … }, … ],
 *       error:    null | string,
 *     },
 *     …
 *   ]
 *
 * Dev mode (mock-token-dev-only) skips network and returns a small mock
 * timeline so the layout can be developed without the GDT proxy.
 */

import { useState, useEffect } from 'react'
import { parseSurveyName }     from '../lib/parseSurveyName'

const MOCK_TOKEN = 'mock-token-dev-only'

/* ─── mock fixture (dev only) ──────────────────────────────────────────── */
function buildMockRows() {
  const mkSurvey = (apikey, name) => ({
    _apikey: apikey, _id: apikey, name,
    area_name: 'Mock Area', point_name: 'Mock Point',
    ...parseSurveyName(name),
  })
  return [
    {
      point: { _apikey: 'mock-pt-1', name: 'E3', area_name: 'Area - 1' },
      surveys: [
        mkSurvey('s1', 'Short Term Monitoring with Forage Assessment. - 202402051635'),
        mkSurvey('s2', 'Short Term Monitoring with Forage Assessment. - 202305021635'),
        mkSurvey('s3', 'Short Term Monitoring with Forage Assessment. - 202202071635'),
        mkSurvey('s4', 'Short Term Monitoring with Forage Assessment. - 202102161635'),
      ],
      error: null,
    },
    {
      point: { _apikey: 'mock-pt-2', name: 'LL2', area_name: 'Area - 9' },
      surveys: [
        mkSurvey('s5', 'Short Term Monitoring with Forage Assessment. - 202402051635'),
        mkSurvey('s6', 'Short Term Monitoring with Forage Assessment. - 202203031635'),
      ],
      error: null,
    },
    {
      point: { _apikey: 'mock-pt-3', name: 'LL3', area_name: 'Area - 8' },
      surveys: [],
      error: null,
    },
  ]
}

export function useSurveyTimeline(ctx, mappingData) {
  const [rows,    setRows]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [debug,   setDebug]   = useState({ status: 'idle' })

  const apikey  = ctx?.property?._apikey ?? null
  const token   = ctx?.oauth_token       ?? null
  const origin  = ctx?.api_origin        ?? null
  const base    = ctx?.api_base          ?? ''
  const points  = mappingData?.points    ?? []

  // Build a stable dependency key so we re-fire only when the actual point set changes.
  const pointKey = points.map(p => p._apikey).filter(Boolean).join(',')

  useEffect(() => {
    if (!apikey || !token) {
      setDebug({ status: 'idle', reason: 'no apikey or token yet' })
      return
    }
    if (token === MOCK_TOKEN) {
      setDebug({ status: 'mock' })
      setRows(buildMockRows())
      return
    }
    if (points.length === 0) {
      setDebug({ status: 'skipped', reason: 'no points in mappingData' })
      setRows([])
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setDebug({ status: 'loading', pointCount: points.length })
    const t0 = Date.now()

    const fetchPointSurveys = async (point) => {
      const params = new URLSearchParams({ point_apikey: point._apikey })
      if (origin) params.set('api_origin', origin)
      if (base)   params.set('api_base',   base)

      try {
        const res = await fetch(`/api/surveys?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          return { point, surveys: [], error: `HTTP ${res.status}` }
        }
        const data = await res.json()
        // GDT envelope is { list: [...] }; handle a couple of variants defensively.
        const list = data?.list ?? data?.data?.list ?? data?.data ?? (Array.isArray(data) ? data : [])
        const surveys = list
          .map((s) => ({ ...s, ...parseSurveyName(s.name) }))
          .filter((s) => s.ok) // drop unparseable entries
        return { point, surveys, error: null }
      } catch (err) {
        return { point, surveys: [], error: err.message }
      }
    }

    Promise.all(points.map(fetchPointSurveys))
      .then((results) => {
        if (cancelled) return
        const totalSurveys = results.reduce((sum, r) => sum + r.surveys.length, 0)
        const errorRows    = results.filter(r => r.error).length
        setRows(results)
        setDebug({
          status: 'ok',
          pointCount:    points.length,
          totalSurveys,
          errorRows,
          elapsedMs:     Date.now() - t0,
        })
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
        setDebug({ status: 'error', reason: err.message, elapsedMs: Date.now() - t0 })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [apikey, token, origin, base, pointKey])

  return { rows, loading, error, debug }
}
