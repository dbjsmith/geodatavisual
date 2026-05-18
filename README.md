# GeoDataVisual

Iframe visualisation plugin for the GeoDataTrack BlueBox platform.

Loaded inside BlueBox at the property / area / geopoint / survey / reports level, GDV receives a `navigation_context` via `postMessage` and renders the matching dashboard — EHI gauges, trend lines, process radar, indicator grids, and a Leaflet map with real boundaries and monitoring points.

## Tech stack

- **React 18** + **Vite 5**
- **Tailwind v4** (CSS-first config via `@theme` in `src/index.css`)
- **Recharts** for trend / radar / bar charts
- **Leaflet** + lazy-loaded react integration for the map
- **Netlify Functions** for the GDT OAuth proxy (`/api/mapping`)

## Project layout

```
src/
  App.jsx                      ← level switcher driven by postMessage
  main.jsx                     ← React root
  index.css                    ← Tailwind v4 + GDT theme tokens
  hooks/
    useHostContext.js          ← postMessage listener + dev-mode mock fallback
    useMappingData.js          ← /api/mapping fetch
  lib/
    colorScale.js              ← EHI → colour helpers
    spatialUtils.js            ← API payload → GeoJSON / markers / bounds
    postMessage.js             ← host:init / host:navigate / gdv:ready
    mockData.js                ← Thornfield Station fixture for dev mode
  components/
    MapView.jsx                ← Leaflet map (boundaries, areas, points)
    charts/
      EHIGauge.jsx
      TrendChart.jsx
      ProcessRadar.jsx
      IndicatorGrid.jsx
    levels/
      OrgLevel.jsx
      PropertyLevel.jsx
      AreaLevel.jsx
      GeopointLevel.jsx
      SurveyLevel.jsx
      ReportsLevel.jsx
netlify/functions/
  mapping.mjs                  ← server-side proxy for GET /oauth/mapping
```

## Local dev

```bash
npm install
npm run dev
```

Open http://localhost:5173. Without a BlueBox host the app falls back to Thornfield Station mock data so the UI is populated. A dev banner at the top of the page makes the mock mode explicit.

To exercise the Netlify proxy locally as well, use the Netlify CLI:

```bash
npm i -g netlify-cli
netlify dev
```

That runs Vite on 5173 and proxies the function `/api/mapping` through port 8888.

## Build

```bash
npm run build
```

Outputs to `dist/`. Netlify auto-runs this on push to `main` once the repo is linked.

## postMessage protocol

BlueBox (host) sends:

```js
{
  type: 'host:init',
  navigation_context: {
    level:       'property',           // or 'org' | 'area' | 'geopoint' | 'survey' | 'reports'
    oauth_token: '<bearer_token>',     // required for /api/mapping
    org:         { _apikey, name },
    property:    { _apikey, name, ehi, area_ha, centroid, ... },
    area?:       { _apikey, name, ehi, ... },
    point?:      { _apikey, name, lat, lng, ehi, ... },
    survey?:     { _apikey, date, surveyor, ehi, indicators, notes },
  }
}
```

GeoDataVisual replies with `{ type: 'gdv:ready' }` after the first render.

Level navigation messages use the same shape with `type: 'host:navigate'`.

## API integration

The `/api/mapping` function proxies `GET /oauth/mapping` on `https://app.blueboxonline.com` (configurable in `netlify/functions/mapping.mjs`). It forwards the `Authorization` header from the client unchanged. The token never leaves the browser → Netlify edge → GDT loop — there are no third parties in the chain.

Required GDT OAuth scopes: `properties.read`, `areas.read`, `points.read`.

## Deploy

Pushes to `main` trigger a Netlify build via the GitHub integration. The build runs `npm run build` and publishes `dist/`. Functions in `netlify/functions/` are auto-deployed.

Site: https://geodatavisual.netlify.app

## Open work

- Wire up `/oauth/trends` once available (currently mock).
- Wire up `/oauth/indicators` for real HPG-AI scores (currently mock).
- Reports level needs `/oauth/reports` endpoint.
- Replace the placeholder favicon (`public/favicon.svg`) with the GDT brand mark.
