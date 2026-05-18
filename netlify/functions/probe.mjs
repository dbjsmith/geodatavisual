/**
 * GET /api/probe
 *
 * Discovery helper for mapping the GDT OAuth API surface. Fires a curated
 * list of likely endpoints in parallel and returns status + body samples.
 *
 * Bootstraps a `survey_apikey` automatically by fetching /oauth/surveys
 * first and using the first entry — so probes that target a specific
 * survey record can run without the caller supplying one.
 *
 * Query params:
 *   property_apikey  – required, used as substitution
 *   area_apikey      – optional, used for area-scoped probes
 *   point_apikey     – optional, used for point-scoped probes
 *   survey_apikey    – optional, used for survey-detail probes
 *                      (auto-discovered from /oauth/surveys if absent)
 *   api_origin       – upstream GDT host
 *   api_base         – upstream path prefix
 *
 * Headers:
 *   Authorization: Bearer <token>   – forwarded to each upstream call
 */

const DEFAULT_ORIGIN = 'https://app.blueboxonline.com'

const PROBES = [
  // ─── Confirmed working (kept as sanity baselines) ───────────────────────
  { name: 'surveys (property, query)',     path: '/oauth/surveys',  query: { property_apikey: '{property_apikey}' } },
  { name: 'mapping (baseline)',            path: '/oauth/mapping',  query: { property_apikey: '{property_apikey}' } },
  { name: 'points (baseline)',             path: '/oauth/points',   query: { property_apikey: '{property_apikey}' } },

  // ─── Where do scores live? Individual survey detail ─────────────────────
  { name: 'survey detail (REST)',          path: '/oauth/survey/{survey_apikey}',                                                                      require: 'survey_apikey' },
  { name: 'survey detail (alt REST)',      path: '/oauth/surveys/{survey_apikey}',                                                                     require: 'survey_apikey' },
  { name: 'survey detail (query, _apikey)',path: '/oauth/survey',   query: { _apikey: '{survey_apikey}' },                                             require: 'survey_apikey' },
  { name: 'survey detail (query, apikey)', path: '/oauth/surveys',  query: { _apikey: '{survey_apikey}' },                                             require: 'survey_apikey' },

  // ─── Leaf-scoped surveys (most likely place actual scores live) ─────────
  { name: 'surveys by area_apikey',        path: '/oauth/surveys',  query: { area_apikey:  '{area_apikey}' },                                          require: 'area_apikey'  },
  { name: 'surveys by point_apikey',       path: '/oauth/surveys',  query: { point_apikey: '{point_apikey}' },                                         require: 'point_apikey' },

  // ─── Filter/scope params on the property surveys call ───────────────────
  { name: 'surveys recursive=1',           path: '/oauth/surveys',  query: { property_apikey: '{property_apikey}', recursive: '1' } },
  { name: 'surveys detail=full',           path: '/oauth/surveys',  query: { property_apikey: '{property_apikey}', detail: 'full' } },
  { name: 'surveys include=scores',        path: '/oauth/surveys',  query: { property_apikey: '{property_apikey}', include: 'scores' } },
  { name: 'surveys scope=descendants',     path: '/oauth/surveys',  query: { property_apikey: '{property_apikey}', scope: 'descendants' } },

  // ─── Point/area detail (might bundle their own survey history) ──────────
  { name: 'point detail (REST)',           path: '/oauth/point/{point_apikey}',                                                                        require: 'point_apikey' },
  { name: 'point detail (query)',          path: '/oauth/point',    query: { _apikey: '{point_apikey}' },                                              require: 'point_apikey' },
  { name: 'area detail (REST)',            path: '/oauth/area/{area_apikey}',                                                                          require: 'area_apikey'  },
  { name: 'area detail (query)',           path: '/oauth/area',     query: { _apikey: '{area_apikey}' },                                               require: 'area_apikey'  },
]

export default async (req) => {
  const url       = new URL(req.url)
  const apikey    = url.searchParams.get('property_apikey')
  const auth      = req.headers.get('authorization')
  const apiOrigin = url.searchParams.get('api_origin') || DEFAULT_ORIGIN
  const apiBase   = url.searchParams.get('api_base')   || ''

  const areaApikey  = url.searchParams.get('area_apikey')  || null
  const pointApikey = url.searchParams.get('point_apikey') || null
  let   surveyApikey = url.searchParams.get('survey_apikey') || null

  if (!apikey) return Response.json({ error: 'property_apikey required' }, { status: 400 })
  if (!auth)   return Response.json({ error: 'Authorization required' },   { status: 401 })

  // ── Bootstrap: auto-discover a survey_apikey from /oauth/surveys ──────
  const bootstrap = { surveyApikey: null, error: null }
  if (!surveyApikey) {
    const bootstrapUrl = `${apiOrigin}${apiBase}/oauth/surveys?property_apikey=${encodeURIComponent(apikey)}`
    try {
      const r = await fetch(bootstrapUrl, {
        headers: { Authorization: auth, Accept: 'application/json' },
      })
      if (r.ok) {
        const j = await r.json()
        // Response shape from probe round 1: { list: [{ _apikey, ... }, ...] }
        const first = j?.list?.[0] ?? j?.data?.list?.[0] ?? j?.data?.[0] ?? j?.[0]
        surveyApikey = first?._apikey ?? null
        bootstrap.surveyApikey = surveyApikey
      } else {
        bootstrap.error = `bootstrap HTTP ${r.status}`
      }
    } catch (err) {
      bootstrap.error = `bootstrap fetch failed: ${err.message}`
    }
  } else {
    bootstrap.surveyApikey = surveyApikey
    bootstrap.error = '(supplied by caller)'
  }

  // ── Substitute placeholders, skip probes missing required apikeys ─────
  const subs = {
    property_apikey: apikey,
    area_apikey:     areaApikey,
    point_apikey:    pointApikey,
    survey_apikey:   surveyApikey,
  }

  const substitute = (str, encode = false) =>
    str.replace(/\{(property_apikey|area_apikey|point_apikey|survey_apikey)\}/g, (_, key) => {
      const v = subs[key]
      return v == null ? '' : (encode ? encodeURIComponent(v) : v)
    })

  const results = await Promise.all(PROBES.map(async ({ name, path, query, require: requiredKey }) => {
    // Skip probes whose required apikey isn't available
    if (requiredKey && !subs[requiredKey]) {
      return { name, skipped: true, reason: `missing ${requiredKey}` }
    }

    const interpolatedPath = substitute(path, true)
    let upstreamUrl
    try {
      upstreamUrl = new URL(`${apiOrigin}${apiBase}${interpolatedPath}`)
    } catch (e) {
      return { name, error: `bad URL: ${e.message}` }
    }

    if (query) {
      for (const [k, v] of Object.entries(query)) {
        upstreamUrl.searchParams.set(k, substitute(String(v), false))
      }
    }

    const startTime = Date.now()
    try {
      const upstream = await fetch(upstreamUrl.toString(), {
        headers: { Authorization: auth, Accept: 'application/json' },
      })
      const text = await upstream.text()
      return {
        name,
        upstream_url: upstreamUrl.toString(),
        status:       upstream.status,
        ok:           upstream.ok,
        content_type: upstream.headers.get('content-type'),
        body_preview: text.slice(0, 3000),
        body_length:  text.length,
        time_ms:      Date.now() - startTime,
      }
    } catch (err) {
      return {
        name,
        upstream_url: upstreamUrl.toString(),
        error:        err.message,
        time_ms:      Date.now() - startTime,
      }
    }
  }))

  return Response.json({ results, bootstrap, probed_at: new Date().toISOString() })
}

export const config = {
  path: '/api/probe',
}
