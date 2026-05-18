/**
 * MapView.jsx
 *
 * Interactive property map using real spatial data from /api/mapping.
 * - Property boundary drawn from boundary_geojson (no manual KML upload needed)
 * - Geopoint markers at real lat/lng (no synthetic demo positions)
 * - Area boundaries as subtle fills
 * - Markers coloured by EHI score
 *
 * Dependencies:
 *   leaflet, react-leaflet (installed via package.json)
 *
 * Usage:
 *   <MapView mappingData={mappingData} loading={loading} error={error} />
 */

import { useEffect, useRef, useState } from 'react'
import { ehiColor, ehiLabel } from '../lib/colorScale'
import {
  propertyBoundaryGeoJSON,
  areaBoundaryGeoJSON,
  geopointMarkers,
  deriveBounds,
} from '../lib/spatialUtils'

export default function MapView({ mappingData, loading, error }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const layersRef    = useRef([])
  const [L, setL]    = useState(null)

  // ── Lazy-load Leaflet on mount (browser only) ────────────────────────────
  useEffect(() => {
    let cancelled = false
    Promise.all([
      import('leaflet'),
      import('leaflet/dist/leaflet.css'),
    ]).then(([leaflet]) => {
      if (!cancelled) setL(leaflet.default ?? leaflet)
    })
    return () => { cancelled = true }
  }, [])

  // ── Initialise Leaflet map once L is loaded ──────────────────────────────
  useEffect(() => {
    if (!L || !containerRef.current || mapRef.current) return

    mapRef.current = L.map(containerRef.current, {
      zoomControl:        true,
      scrollWheelZoom:    true,
      attributionControl: true,
    }).setView([51.5, -1.5], 10)

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '© OpenStreetMap contributors' }
    ).addTo(mapRef.current)

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [L])

  // ── Draw/update layers when mappingData changes ──────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!L || !map || !mappingData) return

    layersRef.current.forEach(l => map.removeLayer(l))
    layersRef.current = []

    const { properties = [], areas = [], points = [] } = mappingData
    const add = layer => { layer.addTo(map); layersRef.current.push(layer) }

    // 1. Property boundary (thick green outline)
    const propGeoJSON = propertyBoundaryGeoJSON(properties)
    if (propGeoJSON.features.length) {
      add(L.geoJSON(propGeoJSON, {
        style: {
          color:       '#2d6a4f',
          weight:      3,
          opacity:     0.9,
          fillOpacity: 0.06,
          fillColor:   '#2d6a4f',
        },
        onEachFeature: (feature, layer) => {
          layer.bindPopup(`<strong>${feature.properties.name}</strong>`)
        },
      }))
    }

    // 2. Area boundaries (EHI-coloured fills)
    const areaGeoJSON = areaBoundaryGeoJSON(areas)
    if (areaGeoJSON.features.length) {
      add(L.geoJSON(areaGeoJSON, {
        style: feat => ({
          color:       '#40916c',
          weight:      1.5,
          opacity:     0.7,
          dashArray:   '4 4',
          fillOpacity: 0.18,
          fillColor:   ehiColor(feat.properties.ehi ?? 5),
        }),
        onEachFeature: (feature, layer) => {
          const ehi = feature.properties.ehi
          layer.bindPopup(
            `<strong>${feature.properties.name}</strong>` +
            (ehi != null ? `<br/>EHI ${ehi.toFixed(1)} — ${ehiLabel(ehi)}` : '')
          )
        },
      }))
    }

    // 3. Geopoint markers
    const markers = geopointMarkers(points)
    for (const pt of markers) {
      const colour = ehiColor(pt.ehi ?? 5)
      add(L.circleMarker([pt.lat, pt.lng], {
        radius:      8,
        fillColor:   colour,
        color:       '#fff',
        weight:      2,
        opacity:     1,
        fillOpacity: 0.85,
      }).bindPopup(
        `<strong>${pt.name}</strong>` +
        (pt.ehi != null ? `<br/>EHI ${pt.ehi.toFixed(1)} — ${ehiLabel(pt.ehi)}` : '<br/>No EHI score')
      ))
    }

    // 4. Fit map to all features
    const bounds = deriveBounds({ properties, areas, points })
    if (bounds) {
      map.fitBounds(bounds, { padding: [24, 24] })
    }

  }, [L, mappingData])

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-lg overflow-hidden border border-gdt-border">
      <div ref={containerRef} className="w-full h-full" />

      {(loading || !L) && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-[400]">
          <div className="flex items-center gap-2 text-sm text-gdt-slate">
            <Spinner /> Loading map data…
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-[400]">
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 max-w-xs text-center">
            <div className="font-semibold mb-1">Map data unavailable</div>
            <div className="text-xs opacity-80">{error}</div>
          </div>
        </div>
      )}

      {mappingData && !loading && (
        <div className="absolute bottom-3 right-3 z-[400] bg-white/90 backdrop-blur-sm rounded-lg border border-gdt-border px-3 py-2 shadow text-[11px] space-y-1">
          {[
            { label: 'Excellent', score: 9 },
            { label: 'Good',      score: 7 },
            { label: 'Moderate',  score: 5.5 },
            { label: 'Poor',      score: 4 },
            { label: 'Critical',  score: 2 },
          ].map(({ label, score }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ehiColor(score) }} />
              <span className="text-gdt-slate">{label}</span>
            </div>
          ))}
          <div className="border-t border-gdt-border pt-1 text-gdt-slate-lt">EHI colour scale</div>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4 text-gdt-green" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}
