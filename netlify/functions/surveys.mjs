/**
 * GET /api/surveys
 *
 * Generic proxy for GDT /oauth/surveys. Forwards any filter params
 * (property_apikey, area_apikey, point_apikey, …) to the upstream GDT
 * instance. The api_origin and api_base query params are stripped from
 * the forwarded request (they only configure the proxy itself).
 *
 * Auth: forwards the inbound Authorization header verbatim.
 */

const DEFAULT_ORIGIN = 'https://app.blueboxonline.com'
const CONFIG_KEYS    = new Set(['api_origin', 'api_base'])

export default async (req) => {
  const url       = new URL(req.url)
  const auth      = req.headers.get('authorization')
  const apiOrigin = url.searchParams.get('api_origin') || DEFAULT_ORIGIN
  const apiBase   = url.searchParams.get('api_base')   || ''

  if (!auth) return Response.json({ error: 'Authorization required' }, { status: 401 })

  const upstreamUrl = new URL(`${apiOrigin}${apiBase}/oauth/surveys`)
  for (const [k, v] of url.searchParams) {
    if (!CONFIG_KEYS.has(k)) upstreamUrl.searchParams.set(k, v)
  }

  try {
    const upstream = await fetch(upstreamUrl.toString(), {
      headers: { Authorization: auth, Accept: 'application/json' },
    })
    const text = await upstream.text()
    if (!upstream.ok) {
      return Response.json(
        { error: `Upstream ${upstream.status}`, detail: text.slice(0, 500), upstream_url: upstreamUrl.toString() },
        { status: upstream.status },
      )
    }
    return new Response(text, {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  } catch (err) {
    return Response.json({ error: 'fetch failed', detail: err.message }, { status: 502 })
  }
}

export const config = {
  path: '/api/surveys',
}
