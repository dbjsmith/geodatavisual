/**
 * MapView
 *
 * Leaflet map showing property boundary, area polygons, and monitoring
 * points colour-coded by EHI. Lazy-loads Leaflet on first render so
 * SSR/server builds don't choke on `window`.
 *
 * Map controls:
 *   - Zoom (top-left, default Leaflet)
 *   - Fit-to-property (top-right, custom) — recentres the map on the
 *     property boundary at any time. Triggered automatically once on
 *     first data load too.
 *
 * EHI colouring comes from lib/colorScale (ehiColor / ehiLabel).
 */

import { useEffect, useRef } from 'react'
import { ehiColor, ehiLabel } from '../lib/colorScale'

export default function MapView({ mappingData, loading, error }) {
  const containerRef        = useRef(null)
  const mapRef              = useRef(null)
  const dataLayerRef        = useRef(null)
  const propertyBoundsRef   = useRef(null)
  const fitControlRef       = useRef(null)
  const hasInitialFitRef    = useRef(false)

  /* ─── Initialise map once ──────────────────────────────────────────── */
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    let cancelled = false

    ;(async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      if (cancelled || !containerRef.current) return

      const map = L.map(containerRef.current, {
        center: [-30, 25],
        zoom: 5,
        scrollWheelZoom: true,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      // ── Custom "Fit to property" control ──────────────────────────────
      const FitControl = L.Control.extend({
        onAdd() {
          const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control')
          const a = L.DomUtil.create('a', '', container)
          a.href = '#'
          a.role = 'button'
          a.title = 'Fit map to property boundary'
          a.setAttribute('aria-label', 'Fit map to property boundary')
          a.style.cssText = [
            'display:flex', 'align-items:center', 'justify-content:center',
            'width:30px', 'height:30px',
            'background:white', 'color:#2d3748',
            'text-decoration:none',
          ].join(';')
          // SVG icon: square with corner brackets (universal "fit to view")
          a.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 7V3h4"></path>
              <path d="M21 7V3h-4"></path>
              <path d="M3 17v4h4"></path>
              <path d="M21 17v4h-4"></path>
            </svg>`
          L.DomEvent.on(a, 'click', (e) => {
            L.DomEvent.preventDefault(e)
            L.DomEvent.stopPropagation(e)
            fitToProperty()
          })
          // Stop wheel/double-click bubbling into the map
          L.DomEvent.disableClickPropagation(container)
          L.DomEvent.disableScrollPropagation(container)
          return container
        },
      })

      const fitControl = new FitControl({ position: 'topright' })
      fitControl.addTo(map)

      mapRef.current        = map
      fitControlRef.current = fitControl
    })()

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        dataLayerRef.current = null
        propertyBoundsRef.current = null
        fitControlRef.current = null
        hasInitialFitRef.current = false
      }
    }
  }, [])

  /* ─── Render data layers when mappingData updates ──────────────────── */
  useEffect(() => {
    if (!mapRef.current || !mappingData) return

    let cancelled = false
    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !mapRef.current) return
      const map = mapRef.current

      // Wipe previous data layer (keep tile layer + controls intact)
      if (dataLayerRef.current) {
        dataLayerRef.current.clearLayers()
      } else {
        dataLayerRef.current = L.layerGroup().addTo(map)
      }
      const dataLayer = dataLayerRef.current

      // ── Property boundary ────────────────────────────────────────────
      let propertyBounds = null
      const property = mappingData.properties?.[0]
      if (property?.boundary_geojson) {
        const propLayer = L.geoJSON(property.boundary_geojson, {
          style: { color: '#2d6a4f', fillColor: '#2d6a4f', fillOpacity: 0.05, weight: 2 },
        }).addTo(dataLayer)
        propertyBounds = propLayer.getBounds()
        propLayer.bindPopup(`<b>${property.name ?? 'Property'}</b>`)
      }
      propertyBoundsRef.current = propertyBounds

      // ── Areas ────────────────────────────────────────────────────────
      for (const area of (mappingData.areas ?? [])) {
        if (!area.boundary_geojson) continue
        const a = L.geoJSON(area.boundary_geojson, {
          style: { color: '#40916c', fillColor: '#40916c', fillOpacity: 0.15, weight: 1.5 },
        }).addTo(dataLayer)
        a.bindPopup(
          `<b>${area.name ?? 'Area'}</b>` +
          (area.area_size != null ? `<br>${area.area_size} ha` : '')
        )
      }

      // ── Monitoring points ────────────────────────────────────────────
      for (const point of (mappingData.points ?? [])) {
        if (!point.has_coordinates && (point.lat == null || point.lng == null)) continue
        const ehi = point.ehi ?? null
        const fill = ehi == null ? '#888780' : ehiColor(ehi)
        const marker = L.circleMarker([point.lat, point.lng], {
          radius: 7,
          color: 'white',
          weight: 2,
          fillColor: fill,
          fillOpacity: 0.95,
        }).addTo(dataLayer)
        marker.bindPopup(
          `<b>${point.name ?? 'Monitoring point'}</b>` +
          (ehi != null ? `<br>EHI: ${ehi} (${ehiLabel(ehi)})` : '<br>Unscored')
        )
      }

      // ── First-load auto-fit only ─────────────────────────────────────
      // Don't re-fit on every data refresh, or it'll hijack the user's
      // pan/zoom. They've got the button if they want to recentre.
      if (!hasInitialFitRef.current && propertyBounds) {
        map.fitBounds(propertyBounds, { padding: [30, 30] })
        hasInitialFitRef.current = true
      }
    })()

    return () => { cancelled = true }
  }, [mappingData])

  /* ─── Imperative: fit to property ──────────────────────────────────── */
  function fitToProperty() {
    const map    = mapRef.current
    const bounds = propertyBoundsRef.current
    if (!map || !bounds) return
    map.fitBounds(bounds, { padding: [30, 30] })
  }

  /* ─── Render ───────────────────────────────────────────────────────── */
  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-gdt-border">
      <div ref={containerRef} className="w-full h-full" />

      {loading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center pointer-events-none z-[400] text-sm text-gdt-slate">
          Loading map data…
        </div>
      )}
      {error && (
        <div className="absolute inset-x-3 top-3 bg-red-50 text-gdt-red text-xs p-2 rounded z-[400]">
          Map data error: {String(error)}
        </div>
      )}

      {/* EHI colour legend overlay */}
      <div className="absolute bottom-3 right-3 bg-white rounded-md shadow-sm p-2 text-[10px] z-[500] border border-gdt-border">
        <div className="text-gdt-slate-lt mb-1">EHI colour scale</div>
        {[
          { tier: 'Strong',     score:  80 },
          { tier: 'Good',       score:  50 },
          { tier: 'Moderate',   score:  15 },
          { tier: 'Poor',       score: -20 },
          { tier: 'Critical',   score: -60 },
        ].map(({ tier, score }) => (
          <div key={tier} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: ehiColor(score) }}
            />
            <span className="text-gdt-slate">{tier}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
