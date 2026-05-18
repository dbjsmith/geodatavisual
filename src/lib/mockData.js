/**
 * mockData.js
 *
 * Thornfield Station — a mock farm in the Cotswolds used as a dev fixture
 * when GeoDataVisual is loaded outside the BlueBox iframe (no postMessage
 * context arrives). Lets you `npm run dev` and see a populated UI.
 *
 * Replaced at runtime by real navigation_context once embedded.
 */

export const mockContext = {
  level:       'property',
  oauth_token: 'mock-token-dev-only',
  org: {
    _apikey: 'org_we-cology',
    name:    'We-cology Demo Org',
  },
  property: {
    _apikey: 'prop_thornfield',
    name:    'Thornfield Station',
    ehi:     7.4,
    area_ha: 184.3,
    centroid:[-1.831, 51.846],
  },
}

/**
 * Mock /api/mapping response — used in dev mode when no real OAuth token.
 */
export const mockMappingData = {
  properties: [
    {
      _apikey:  'prop_thornfield',
      name:     'Thornfield Station',
      ehi:      7.4,
      centroid: [-1.831, 51.846],
      boundary_geojson: {
        type: 'Polygon',
        coordinates: [[
          [-1.842, 51.840],
          [-1.820, 51.840],
          [-1.816, 51.852],
          [-1.830, 51.856],
          [-1.846, 51.851],
          [-1.842, 51.840],
        ]],
      },
      boundary_coordinates: [
        [-1.842, 51.840], [-1.820, 51.840], [-1.816, 51.852],
        [-1.830, 51.856], [-1.846, 51.851], [-1.842, 51.840],
      ],
    },
  ],
  areas: [
    { _apikey: 'area_north_pasture', name: 'North Pasture', ehi: 8.1,
      centroid: [-1.830, 51.852],
      boundary_geojson: { type: 'Polygon', coordinates: [[
        [-1.838, 51.849], [-1.822, 51.849], [-1.822, 51.855],
        [-1.838, 51.855], [-1.838, 51.849],
      ]] },
    },
    { _apikey: 'area_riparian', name: 'Riparian Margin', ehi: 6.2,
      centroid: [-1.828, 51.844],
      boundary_geojson: { type: 'Polygon', coordinates: [[
        [-1.834, 51.841], [-1.822, 51.842], [-1.823, 51.846],
        [-1.835, 51.846], [-1.834, 51.841],
      ]] },
    },
    { _apikey: 'area_woodland', name: 'Hazel Coppice', ehi: 8.7,
      centroid: [-1.840, 51.847],
      boundary_geojson: { type: 'Polygon', coordinates: [[
        [-1.844, 51.844], [-1.836, 51.844], [-1.836, 51.850],
        [-1.844, 51.850], [-1.844, 51.844],
      ]] },
    },
    { _apikey: 'area_arable', name: 'South Arable', ehi: 4.1,
      centroid: [-1.825, 51.843],
      boundary_geojson: { type: 'Polygon', coordinates: [[
        [-1.830, 51.840], [-1.820, 51.840], [-1.820, 51.846],
        [-1.830, 51.846], [-1.830, 51.840],
      ]] },
    },
  ],
  points: [
    { _apikey: 'pt_np_01', name: 'NP-01', area_apikey: 'area_north_pasture',
      lng: -1.832, lat: 51.851, ehi: 8.3, has_coordinates: true },
    { _apikey: 'pt_np_02', name: 'NP-02', area_apikey: 'area_north_pasture',
      lng: -1.828, lat: 51.853, ehi: 7.9, has_coordinates: true },
    { _apikey: 'pt_rm_01', name: 'RM-01', area_apikey: 'area_riparian',
      lng: -1.829, lat: 51.844, ehi: 6.5, has_coordinates: true },
    { _apikey: 'pt_rm_02', name: 'RM-02', area_apikey: 'area_riparian',
      lng: -1.826, lat: 51.845, ehi: 5.8, has_coordinates: true },
    { _apikey: 'pt_hc_01', name: 'HC-01', area_apikey: 'area_woodland',
      lng: -1.840, lat: 51.847, ehi: 9.0, has_coordinates: true },
    { _apikey: 'pt_sa_01', name: 'SA-01', area_apikey: 'area_arable',
      lng: -1.825, lat: 51.843, ehi: 3.8, has_coordinates: true },
    { _apikey: 'pt_sa_02', name: 'SA-02', area_apikey: 'area_arable',
      lng: -1.827, lat: 51.842, ehi: 4.4, has_coordinates: true },
  ],
}

/**
 * Mock EHI trend — 12 months for property-level chart.
 */
export const mockTrend = [
  { month: '2025-06', ehi: 6.1 },
  { month: '2025-07', ehi: 6.3 },
  { month: '2025-08', ehi: 6.6 },
  { month: '2025-09', ehi: 6.8 },
  { month: '2025-10', ehi: 6.9 },
  { month: '2025-11', ehi: 7.0 },
  { month: '2025-12', ehi: 6.9 },
  { month: '2026-01', ehi: 7.1 },
  { month: '2026-02', ehi: 7.2 },
  { month: '2026-03', ehi: 7.3 },
  { month: '2026-04', ehi: 7.3 },
  { month: '2026-05', ehi: 7.4 },
]

/**
 * HPG-AI indicator radar — process & outcome axes.
 */
export const mockIndicators = [
  { indicator: 'Water cycle',       score: 7.8 },
  { indicator: 'Mineral cycle',     score: 6.4 },
  { indicator: 'Energy flow',       score: 8.2 },
  { indicator: 'Community dynamics',score: 7.1 },
  { indicator: 'Soil cover',        score: 8.5 },
  { indicator: 'Plant diversity',   score: 6.9 },
]
