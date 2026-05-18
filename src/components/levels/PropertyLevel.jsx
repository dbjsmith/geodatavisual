/**
 * PropertyLevel — property dashboard.
 *
 * Layout:
 *   ┌─ MappingDebug ribbon (collapsible) ─┐
 *   ┌─ ApiProbe ribbon (collapsible) ─────┐  ← NEW: discovery probe
 *   ┌─ EHI gauge ─┐  ┌─ Trend chart ──────┐
 *   ┌─ Property map ─────────────────────────┐
 *   ┌─ Process radar ──┐  ┌─ Area grid ────┐
 */

import EHIGauge      from '../charts/EHIGauge'
import TrendChart    from '../charts/TrendChart'
import ProcessRadar  from '../charts/ProcessRadar'
import IndicatorGrid from '../charts/IndicatorGrid'
import MapView       from '../MapView'
import { useMappingData } from '../../hooks/useMappingData'
import { useApiProbe }    from '../../hooks/useApiProbe'
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
      <ProbeRibbon ctx={ctx} />

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
 * MappingDebugRibbon — debug for the /api/mapping call.
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

        {debug?.counts && (
          <div>
            <div className="text-gdt-slate font-semibold mb-1">Counts</div>
            <pre className="bg-gdt-bg p-2 rounded">{JSON.stringify(debug.counts, null, 2)}</pre>
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
            <pre className="bg-gdt-bg p-2 rounded">{JSON.stringify(debug.ctxSummary, null, 2)}</pre>
          </div>
        )}
      </div>
    </details>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
 * ProbeRibbon — discovers which GDT OAuth endpoints exist by firing a list
 * of candidate URLs in parallel via /api/probe. Click each entry to expand
 * the response body sample.
 * ────────────────────────────────────────────────────────────────────────── */
function ProbeRibbon({ ctx }) {
  const { results, loading, error } = useApiProbe(ctx)
  const probes = results?.results ?? []

  const okCount    = probes.filter(p => p.ok).length
  const found404   = probes.filter(p => p.status === 404).length
  const errorCount = probes.filter(p => !p.ok && p.status !== 404).length

  let headerStatus
  if (loading)         headerStatus = 'probing…'
  else if (error)      headerStatus = `error — ${error}`
  else if (results)    headerStatus = `${okCount} OK · ${found404} not-found · ${errorCount} other (of ${probes.length})`
  else                 headerStatus = 'idle (need apikey + token)'

  return (
    <details className="card text-xs">
      <summary className="cursor-pointer select-none p-3 flex items-center gap-2">
        <span className="font-semibold text-gdt-slate">🔍 API discovery probe</span>
        <span className="font-mono text-gdt-slate-lt">{headerStatus}</span>
      </summary>

      <div className="p-3 pt-0 space-y-2 font-mono text-[11px]">
        {probes.length === 0 && !loading && !error && (
          <div className="text-gdt-slate-lt p-2">No results yet.</div>
        )}

        {probes.map((r, i) => (
          <ProbeRow key={i} result={r} />
        ))}
      </div>
    </details>
  )
}

function ProbeRow({ result: r }) {
  const statusColour =
    r.error            ? 'text-gdt-red'    :
    r.ok               ? 'text-gdt-green'  :
    r.status === 404   ? 'text-gdt-slate-lt' :
    r.status >= 400 && r.status < 500 ? 'text-gdt-amber' :
                                       'text-gdt-red'

  const statusLabel = r.error ? 'ERR' : (r.status ?? '—')

  return (
    <details className="border border-gdt-border rounded">
      <summary className="cursor-pointer select-none p-2 flex items-center gap-2">
        <span className={`font-semibold tabular-nums ${statusColour} w-8`}>{statusLabel}</span>
        <span className="text-gdt-slate flex-shrink-0">{r.name}</span>
        <span className="text-gdt-slate-lt text-[10px] truncate" title={r.upstream_url}>
          {r.upstream_url}
        </span>
        {r.time_ms != null && (
          <span className="text-gdt-slate-lt text-[10px] ml-auto flex-shrink-0">
            {r.time_ms}ms
          </span>
        )}
      </summary>
      <div className="p-2 pt-0 space-y-1">
        {r.error && (
          <div className="bg-red-50 p-2 rounded break-all">{r.error}</div>
        )}
        {r.content_type && (
          <div className="text-gdt-slate-lt">content-type: {r.content_type}</div>
        )}
        {r.body_length != null && (
          <div className="text-gdt-slate-lt">body length: {r.body_length} bytes</div>
        )}
        {r.body_preview && (
          <pre className="bg-gdt-bg p-2 rounded max-h-48 overflow-auto whitespace-pre-wrap break-all">
            {r.body_preview}
          </pre>
        )}
      </div>
    </details>
  )
}
