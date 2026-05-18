/**
 * GET /api/mapping
 *
 * Proxies the GDT /oauth/mapping endpoint server-side to avoid CORS.
 *
 * Query params:
 *   property_apikey  – the property's API key (required)
 *
 * Headers:
 *   Authorization: Bearer <oauth_token>   – token forwarded from the BlueBox host
 *
 * Returns the bundled { properties, areas, points } from GDT with full spatial data.
 */

const GDT_API_BASE = 'https://app.blueboxonline.com'   // update if base URL differs

export default async (req) => {
  const url  = new URL(req.url)
  const apikey = url.searchParams.get('property_apikey')
  const auth   = req.headers.get('authorization')

  if (!apikey) {
    return Response.json({ error: 'property_apikey is required' }, { status: 400 })
  }
  if (!auth) {
    return Response.json({ error: 'Authorization header is required' }, { status: 401 })
  }

  try {
    const upstream = await fetch(
      `${GDT_API_BASE}/oauth/mapping?property_apikey=${encodeURIComponent(apikey)}`,
      {
        headers: {
          Authorization: auth,
          Accept: 'application/json',
        },
      }
    )

    if (!upstream.ok) {
      const text = await upstream.text()
      return Response.json(
        { error: `GDT API error ${upstream.status}`, detail: text },
        { status: upstream.status }
      )
    }

    const data = await upstream.json()
    return Response.json(data)

  } catch (err) {
    return Response.json({ error: 'Upstream fetch failed', detail: err.message }, { status: 502 })
  }
}

export const config = {
  path: '/api/mapping',
}
