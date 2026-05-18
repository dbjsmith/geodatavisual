/**
 * GET /api/probe
 *
 * Discovery helper for mapping the GDT OAuth API surface. Fires a curated list
 * of likely endpoints in parallel and returns status + body samples so we can
 * see which exist without manually guessing URLs.
 *
 * Used by the ApiProbe panel in the property level view.
 *
 * Query params:
 *   property_apikey  – the property's API key (required, used as substitution)
 *   api_origin       – upstream GDT host (e.g. https://geodatatrack-dev.phpbucket.net)
 *   api_base         – upstream path prefix (e.g. /api/v1)
 *
 * Headers:
 *   Authorization: Bearer <token>   – forwarded to each upstream call
 *
 * Returns: { results: [{ name, upstream_url, status, body_preview, ... }, ...], probed_at }
 */

const DEFAULT_ORIGIN = 'https://app.blueboxonline.com'

/**
 * Probe definitions. Each entry can use `{apikey}` as a placeholder which gets
 * replaced with the property_apikey from the request (URL-encoded in path,
 * raw in query string).
 */
const PROBES = [
  // ─── Primary candidates: surveys list for a property ────────────────────
  { name: 'surveys (property_apikey query)', path: '/oauth/surveys',                       query: { property_apikey: '{apikey}' } },
  { name: 'surveys (_apikey query)',         path: '/oauth/surveys',                       query: { _apikey: '{apikey}' } },
  { name: 'surveys (nested REST)',           path: '/oauth/property/{apikey}/surveys' },
  { name: 'surveys (alt nested)',            path: '/oauth/properties/{apikey}/surveys' },
  { name: 'surveys (flat)',                  path: '/oauth/property/surveys',              query: { property_apikey: '{apikey}' } },

  // ─── Pre-computed time series (long-shots) ──────────────────────────────
  { name: 'trends',                          path: '/oauth/trends',                        query: { property_apikey: '{apikey}' } },
  { name: 'history',                         path: '/oauth/history',                       query: { property_apikey: '{apikey}' } },

  // ─── Property detail (may contain inline survey history) ────────────────
  { name: 'property detail (REST)',          path: '/oauth/property/{apikey}' },
  { name: 'property detail (query)',         path: '/oauth/property',                      query: { property_apikey: '{apikey}' } },
  { name: 'properties detail (REST)',        path: '/oauth/properties/{apikey}' },

  // ─── Catalogue / metadata ───────────────────────────────────────────────
  { name: 'survey types',                    path: '/oauth/survey_types' },
  { name: 'survey types (alt)',              path: '/oauth/surveys/types' },

  // ─── Known working endpoints (sanity baselines) ─────────────────────────
  { name: 'points (baseline)',               path: '/oauth/points',                        query: { property_apikey: '{apikey}' } },
  { name: 'mapping (baseline)',              path: '/oauth/mapping',                       query: { property_apikey: '{apikey}' } },
]

export default async (req) => {
  const url       = new URL(req.url)
  const apikey    = url.searchParams.get('property_apikey')
  const auth      = req.headers.get('authorization')
  const apiOrigin = url.searchParams.get('api_origin') || DEFAULT_ORIGIN
  const apiBase   = url.searchParams.get('api_base')   || ''

  if (!apikey) return Response.json({ error: 'property_apikey required' }, { status: 400 })
  if (!auth)   return Response.json({ error: 'Authorization required' },   { status: 401 })

  const results = await Promise.all(PROBES.map(async ({ name, path, query }) => {
    const interpolatedPath = path.replace('{apikey}', encodeURIComponent(apikey))
    let upstreamUrl
    try {
      upstreamUrl = new URL(`${apiOrigin}${apiBase}${interpolatedPath}`)
    } catch (e) {
      return { name, error: `bad URL: ${e.message}` }
    }

    if (query) {
      for (const [k, v] of Object.entries(query)) {
        upstreamUrl.searchParams.set(k, String(v).replace('{apikey}', apikey))
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
        body_preview: text.slice(0, 2000),
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

  return Response.json({ results, probed_at: new Date().toISOString() })
}

export const config = {
  path: '/api/probe',
}
