/**
 * spatialUtils.js
 *
 * Derives clean map-ready objects from the /api/mapping response.
 * All functions are pure — they accept the raw API payload and return
 * structured data suitable for Leaflet / MapLibre / Mapbox GL.
 */

// ─── Property ──────────────────────────────────────────────────────────────

/**
 * Returns a GeoJSON FeatureCollection of property boundaries.
 * Each feature carries { _apikey, name, ehi? } as properties.
 */
export function propertyBoundaryGeoJSON(properties = []) {
  const features = properties
    .filter(p => p.boundary_geojson)
    .map(p => ({
      type: 'Feature',
      properties: {
        _apikey: p._apikey,
        name:    p.name,
        ehi:     p.ehi ?? null,
      },
      geometry: p.boundary_geojson,
    }))
  return { type: 'FeatureCollection', features }
}

/**
 * Returns a [lng, lat] centre for a property, preferring the API centroid.
 */
export function propertyCenter(property) {
  if (!property) return null
  if (property.centroid) return property.centroid              // [lng, lat]
  if (property.lng != null) return [property.lng, property.lat]
  return null
}

// ─── Areas ─────────────────────────────────────────────────────────────────

/**
 * Returns a GeoJSON FeatureCollection of area boundaries.
 */
export function areaBoundaryGeoJSON(areas = []) {
  const features = areas
    .filter(a => a.boundary_geojson)
    .map(a => ({
      type: 'Feature',
      properties: {
        _apikey: a._apikey,
        name:    a.name,
        ehi:     a.ehi ?? null,
      },
      geometry: a.boundary_geojson,
    }))
  return { type: 'FeatureCollection', features }
}

/**
 * Returns centroid [lng, lat] for an area.
 */
export function areaCenter(area) {
  if (!area) return null
  if (area.centroid) return area.centroid
  if (area.lng != null) return [area.lng, area.lat]
  return null
}

// ─── Geopoints / Monitoring points ─────────────────────────────────────────

/**
 * Returns an array of marker-ready objects from the /oauth/points (or /oauth/mapping points) array.
 * Each item: { _apikey, name, lng, lat, ehi?, area_apikey? }
 */
export function geopointMarkers(points = []) {
  return points
    .filter(p => p.has_coordinates && p.lng != null && p.lat != null)
    .map(p => ({
      _apikey:     p._apikey,
      name:        p.name,
      lng:         p.lng,
      lat:         p.lat,
      area_apikey: p.area_apikey ?? null,
      ehi:         p.ehi ?? null,
    }))
}

// ─── Bounding box ──────────────────────────────────────────────────────────

/**
 * Returns a Leaflet-style bounds array [[minLat, minLng], [maxLat, maxLng]]
 * that fits all supplied properties, areas and points.
 * Returns null if no coordinate data is present.
 */
export function deriveBounds({ properties = [], areas = [], points = [] } = {}) {
  const lngs = []
  const lats = []

  const push = (lng, lat) => {
    if (lng != null && lat != null) { lngs.push(lng); lats.push(lat) }
  }

  for (const p of properties) {
    if (p.centroid) push(p.centroid[0], p.centroid[1])
    else if (p.lng != null) push(p.lng, p.lat)
    if (p.boundary_coordinates) {
      for (const [ln, lt] of p.boundary_coordinates) push(ln, lt)
    }
  }
  for (const a of areas) {
    if (a.centroid) push(a.centroid[0], a.centroid[1])
    else if (a.lng != null) push(a.lng, a.lat)
    if (a.boundary_coordinates) {
      for (const [ln, lt] of a.boundary_coordinates) push(ln, lt)
    }
  }
  for (const pt of points) {
    if (pt.has_coordinates) push(pt.lng, pt.lat)
  }

  if (!lngs.length) return null

  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ]
}
