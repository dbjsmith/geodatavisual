/**
 * PropertyLevel — property dashboard.
 *
 * Swaps the placeholder "UNSCORED" IndicatorGrid for AreaRanking, which
 * shows monitoring points ranked by current EHI with tier-coloured
 * badges, sparklines, and baseline-to-current deltas using real
 * dataset scores.
 */

import EHIGauge            from '../charts/EHIGauge'
import TrendChart          from '../charts/TrendChart'
import ProcessRadar        from '../charts/ProcessRadar'
import AreaRanking         from '../charts/AreaRanking'
import IndicatorBreakdown  from '../charts/IndicatorBreakdown'
import MapView             from '../MapView'
import MonitoringTimeline  from '../MonitoringTimeline'

import { useMappingData }    from '../../hooks/useMappingData'
import { useApiProbe }       from '../../hooks/useApiProbe'
import { useSurveyTimeline } from '../../hooks/useSurveyTimeline'
import { useEHIDataset }     from '../../hooks/useEHIDataset'

export default function PropertyLevel({ ctx }) {
  const { mappingData, loading, error, debug } = useMappingData(ctx)
  const timeline = useSurveyTimeline(ctx, mappingData)
  const ehiData  = useEHIDataset(ctx)

  const property = ctx?.property ?? {}
  const areas    = mappingData?.areas ?? []

  const propertyEHI            = ehiData.latest?.property_ehi_weighted ?? property.ehi ?? null
  const trendData              = ehiData.trend ?? ctx?.trend ?? null
  const processIndices         = ehiData.latest?.process_indices    ?? null
  const baselineProcessIndices = ehiData.trend?.[0]?.process_indices ?? null

  const sampleAreaApikey  = mappingData?.areas?.[0]?._apikey  ?? null
  const samplePointApikey = mappingData?.points?.[0]?._apikey ?? null

  return (
    <div className="flex flex-col gap-5 p-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-gdt-slate-lt">Property</div>
          <h1 className="text-xl font-semibold text-gdt-slate">{property.name ?? 'Unnamed property'}</h1>
          <p className="text-sm text-gdt-slate-lt mt-1">
            {ehiData.dataset?.property?.ecoregion ?? property.ecoregion ?? ''}
            {ehiData.dataset?.property?.is_brittle && ' · brittle environment'}
            {' · '}
            {ehiData.dataset?.property?.total_hectares ?? property.area_ha} ha
            {' · '}
            {areas.length} {areas.length === 1 ? 'area' : 'areas'}
          </p>
        </div>
      </header>

      <MappingDebugRibbon debug={debug} />
      <ProbeRibbon
        ctx={ctx}
        sampleAreaApikey={sampleAreaApikey}
        samplePointApikey={samplePointApikey}
      />

      <section className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
        <EHIGauge
          score={propertyEHI}
          label="Property EHI (weighted)"
          sublabel={ehiData.latest ? `${ehiData.latest.year_label} · ${ehiData.latest.point_count} pts` : null}
        />
        <TrendChart
          data={trendData}
          title="Property EHI trend"
          source={ehiData.hasData ? 'BELImport.xlsx · weighted by strata' : null}
        />
      </section>

      <section>
        <MonitoringTimeline
          rows={timeline.rows}
          loading={timeline.loading}
          error={timeline.error}
          debug={timeline.debug}
        />
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
          <MapView mappingData={mappingData} loading={loading} error={error} />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProcessRadar
          indices={processIndices}
          compare={baselineProcessIndices}
          currentLabel={ehiData.latest?.year_label ?? 'Current'}
          compareLabel={ehiData.trend?.[0]?.year_label ?? 'Baseline'}
          source={ehiData.hasData ? 'BELImport.xlsx · strata-weighted' : null}
        />
        <AreaRanking
          dataset={ehiData.dataset}
          mappingData={mappingData}
        />
      </section>

      <section>
        <IndicatorBreakdown
          dataset={ehiData.dataset}
          latest={ehiData.latest}
          trend={ehiData.trend}
        />
      </section>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
 * Debug ribbons — unchanged.
 * ────────────────────────────────────────────────────────────────────────── */
function MappingDebugRibbon({ debug }) {
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
            <div className="text-gdt-slate font-semibold mb-1">Response body</div>
            <pre className="bg-gdt-bg p-2 rounded max-h-64 overflow-auto whitespace-pre-wrap break-all">{debug.responseText}</pre>
          </div>
        )}
      </div>
    </details>
  )
}

function ProbeRibbon({ ctx, sampleAreaApikey, samplePointApikey }) {
  const { results, loading, error } = useApiProbe(ctx, { sampleAreaApikey, samplePointApikey })

  const probes    = results?.results   ?? []
  const bootstrap = results?.bootstrap ?? null

  const okCount      = probes.filter(p => p.ok).length
  const skippedCount = probes.filter(p => p.skipped).length
  const found404     = probes.filter(p => p.status === 404).length
  const errorCount   = probes.filter(p => !p.ok && !p.skipped && p.status !== 404).length

  let headerStatus
  if (loading)         headerStatus = 'probing…'
  else if (error)      headerStatus = `error — ${error}`
  else if (results)    headerStatus = `${okCount} OK · ${found404} 404 · ${errorCount} other · ${skippedCount} skipped`
  else                 headerStatus = 'idle (need apikey + token)'

  return (
    <details className="card text-xs">
      <summary className="cursor-pointer select-none p-3 flex items-center gap-2">
        <span className="font-semibold text-gdt-slate">🔍 API discovery probe</span>
        <span className="font-mono text-gdt-slate-lt">{headerStatus}</span>
      </summary>
      <div className="p-3 pt-0 space-y-2 font-mono text-[11px]">
        {bootstrap && (
          <div className="bg-gdt-bg p-2 rounded text-gdt-slate-lt">
            <span className="font-semibold text-gdt-slate">bootstrap:</span>{' '}
            {bootstrap.surveyApikey
              ? <>discovered survey_apikey <code className="text-gdt-green">{bootstrap.surveyApikey}</code></>
              : <span className="text-gdt-red">no survey_apikey discovered{bootstrap.error ? ` (${bootstrap.error})` : ''}</span>}
          </div>
        )}
        {probes.map((r, i) => <ProbeRow key={i} result={r} />)}
      </div>
    </details>
  )
}

function ProbeRow({ result: r }) {
  const statusColour =
    r.skipped          ? 'text-gdt-slate-lt' :
    r.error            ? 'text-gdt-red'    :
    r.ok               ? 'text-gdt-green'  :
    r.status === 404   ? 'text-gdt-slate-lt' :
    r.status >= 400 && r.status < 500 ? 'text-gdt-amber' :
                                       'text-gdt-red'
  const statusLabel = r.skipped ? 'SKIP' : r.error ? 'ERR' : (r.status ?? '—')

  return (
    <details className="border border-gdt-border rounded">
      <summary className="cursor-pointer select-none p-2 flex items-center gap-2">
        <span className={`font-semibold tabular-nums ${statusColour} w-10`}>{statusLabel}</span>
        <span className="text-gdt-slate flex-shrink-0">{r.name}</span>
        <span className="text-gdt-slate-lt text-[10px] truncate" title={r.upstream_url}>
          {r.upstream_url ?? (r.reason && `— ${r.reason}`)}
        </span>
        {r.time_ms != null && (
          <span className="text-gdt-slate-lt text-[10px] ml-auto flex-shrink-0">{r.time_ms}ms</span>
        )}
      </summary>
      <div className="p-2 pt-0 space-y-1">
        {r.skipped && <div className="text-gdt-slate-lt">skipped — {r.reason}</div>}
        {r.error && <div className="bg-red-50 p-2 rounded break-all">{r.error}</div>}
        {r.content_type && <div className="text-gdt-slate-lt">content-type: {r.content_type}</div>}
        {r.body_length != null && <div className="text-gdt-slate-lt">body length: {r.body_length} bytes</div>}
        {r.body_preview && (
          <pre className="bg-gdt-bg p-2 rounded max-h-48 overflow-auto whitespace-pre-wrap break-all">{r.body_preview}</pre>
        )}
      </div>
    </details>
  )
}
