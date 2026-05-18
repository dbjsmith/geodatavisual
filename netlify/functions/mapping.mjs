/**
 * GET /api/mapping
 *
 * Proxies the GDT mapping endpoint server-side to avoid CORS.
 *
 * Query params:
 *   property_apikey  – the property's API key (required)
 *   api_origin       – the GDT host origin (e.g. https://geodatatrack-dev.phpbucket.net)
 *                      Defaults to production app.blueboxonline.com if absent.
 *   api_base         – path prefix the GDT API is mounted under (e.g. /api/v1).
 *                      Empty by default.
 *
 * Headers:
 *   Authorization: Bearer <access_token>   – forwarded unchanged to GDT.
 *
 * Returns the bundled { properties, areas, points } from GDT with full spatial data.
 */

const DEFAULT_ORIGIN = 'https://app.blueboxonline.com'

export default async (req) => {
  const url    = new URL(req.url)
  const apikey = url.searchParams.get('property_apikey')
  const auth   = req.headers.get('authorization')

  const apiOrigin = url.searchParams.get('api_origin') || DEFAULT_ORIGIN
  const apiBase   = url.searchParams.get('api_base')   || ''

  if (!apikey) {
    return Response.json({ error: 'property_apikey is required' }, { status: 400 })
  }
  if (!auth) {
    return Response.json({ error: 'Authorization header is required' }, { status: 401 })
  }

  const upstreamUrl =
    `${apiOrigin}${apiBase}/oauth/mapping?property_apikey=${encodeURIComponent(apikey)}`

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        Authorization: auth,
        Accept:        'application/json',
      },
    })

    if (!upstream.ok) {
      const text = await upstream.text()
      return Response.json(
        { error: `GDT API error ${upstream.status}`, upstream_url: upstreamUrl, detail: text },
        { status: upstream.status }
      )
    }

    const data = await upstream.json()
    return Response.json(data)

  } catch (err) {
    return Response.json(
      { error: 'Upstream fetch failed', upstream_url: upstreamUrl, detail: err.message },
      { status: 502 }
    )
  }
}

export const config = {
  path: '/api/mapping',
}
