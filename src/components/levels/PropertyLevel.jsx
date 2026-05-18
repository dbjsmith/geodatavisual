/**
 * PropertyLevel — property dashboard.
 *
 * Layout:
 *   ┌─ MappingDebug strip (always visible while embedded) ─┐
 *   ┌─ EHI gauge ─┐  ┌─ Trend chart (12mo) ─┐
 *   ┌─ Property map ────────────────────────────────────────┐
 *   ┌─ Process radar ──┐  ┌─ Area grid ────┐
 */

import EHIGauge      from '../charts/EHIGauge'
import TrendChart    from '../charts/TrendChart'
import ProcessRadar  from '../charts/ProcessRadar'
import IndicatorGrid from '../charts/IndicatorGrid'
import MapView       from '../MapView'
import { useMappingData } from '../../hooks/useMappingData'
import { mockTrend, mockIndicators } from '../../lib/mockData'

export default function PropertyLevel({ ctx }) {
  const { mappingData, loading, error, debug } = useMappingData(ctx)
  const property = ctx?.property ?? {}

  const trend      = ctx?.trend      ?? mockTrend
  const indicators = ctx?.indicators ?? mockIndicators
  const areas      = mappingData?.areas ?? []

  return (
    <div className="flex flex-col gap-5 p-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-gdt-slate-lt">Property</div>
          <h1 className="text-xl font-semibold text-gdt-slate">{property.name ?? 'Unnamed property'}</h1>
          {property.area_ha != null && (
            <p className="text-sm text-gdt-slate-lt mt-1">
              {property.area_ha} ha · {areas.length} {areas.length === 1 ? 'area' : 'areas'}
            </p>
          )}
        </div>
      </header>

      <MappingDebugRibbon debug={debug} ctx={ctx} />

      <section className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
        <EHIGauge score={property.ehi} label="Property EHI" />
        <TrendChart data={trend} title="EHI trend" />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gdt-slate mb-3">
          Property Map
          {mappingData && (
            <span className="ml-2 text-[11px] font-normal text-gdt-slate-lt">
              {mappingData.points?.filter(p => p.has_coordinates).length ?? 0} monitoring points ·{' '}
              {mappingData.areas?.length ?? 0} areas
            </span>
          )}
        </h2>
        <div className="h-[420px]">
          <MapView
            mappingData={mappingData}
            loading={loading}
            error={error}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProcessRadar data={indicators} />
        <IndicatorGrid items={areas} title="Areas" emptyText="No areas defined." />
      </section>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
 * MappingDebugRibbon — collapsible debug panel for the /api/mapping call.
 * Shows the request URL, status, response body, and ctx summary so we can
 * diagnose live data issues without DevTools.
 * ────────────────────────────────────────────────────────────────────────── */
function MappingDebugRibbon({ debug, ctx }) {
  const statusColour = {
    idle:    'text-gdt-slate-lt',
    skipped: 'text-gdt-amber',
    loading: 'text-gdt-slate',
    ok:      'text-gdt-green',
    error:   'text-gdt-red',
  }[debug?.status] ?? 'text-gdt-slate-lt'

  return (
    <details className="card text-xs">
      <summary className="cursor-pointer select-none p-3 flex items-center gap-2">
        <span className="font-semibold text-gdt-slate">🐛 Mapping API debug</span>
        <span className={`font-mono ${statusColour}`}>
          {debug?.status ?? '—'}
          {debug?.httpStatus ? ` · HTTP ${debug.httpStatus}` : ''}
          {debug?.reason ? ` · ${debug.reason}` : ''}
        </span>
      </summary>

      <div className="p-3 pt-0 space-y-3 font-mono text-[11px]">
        {debug?.requestUrl && (
          <div>
            <div className="text-gdt-slate font-semibold mb-1">Request URL</div>
            <div className="bg-gdt-bg p-2 rounded break-all">{debug.requestUrl}</div>
          </div>
        )}

        {debug?.fetchError && (
          <div>
            <div className="text-gdt-red font-semibold mb-1">Fetch error</div>
            <div className="bg-red-50 p-2 rounded break-all">{debug.fetchError}</div>
          </div>
        )}

        {debug?.responseText && (
          <div>
            <div className="text-gdt-slate font-semibold mb-1">
              Response body {debug.httpStatusText ? `(${debug.httpStatusText})` : ''}
            </div>
            <pre className="bg-gdt-bg p-2 rounded max-h-64 overflow-auto whitespace-pre-wrap break-all">
              {debug.responseText}
            </pre>
          </div>
        )}

        {debug?.ctxSummary && (
          <div>
            <div className="text-gdt-slate font-semibold mb-1">ctx summary</div>
            <pre className="bg-gdt-bg p-2 rounded">
              {JSON.stringify(debug.ctxSummary, null, 2)}
            </pre>
          </div>
        )}

        <div>
          <div className="text-gdt-slate font-semibold mb-1">Full ctx</div>
          <pre className="bg-gdt-bg p-2 rounded max-h-64 overflow-auto whitespace-pre-wrap break-all">
            {JSON.stringify(ctx, null, 2)}
          </pre>
        </div>
      </div>
    </details>
  )
}
