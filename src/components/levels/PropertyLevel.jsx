/**
 * PropertyLevel — property dashboard.
 *
 * Layout:
 *   ┌─ EHI gauge ─┐  ┌─ Trend chart (12mo) ─┐
 *   └─────────────┘  └──────────────────────┘
 *   ┌─ Property map (real boundaries + points) ────────┐
 *   └──────────────────────────────────────────────────┘
 *   ┌─ Process radar ──┐  ┌─ Area grid ────┐
 *   └──────────────────┘  └────────────────┘
 */

import EHIGauge      from '../charts/EHIGauge'
import TrendChart    from '../charts/TrendChart'
import ProcessRadar  from '../charts/ProcessRadar'
import IndicatorGrid from '../charts/IndicatorGrid'
import MapView       from '../MapView'
import { useMappingData } from '../../hooks/useMappingData'
import { mockTrend, mockIndicators } from '../../lib/mockData'

export default function PropertyLevel({ ctx }) {
  const { mappingData, loading, error } = useMappingData(ctx)
  const property = ctx?.property ?? {}

  // Trend + indicators currently come from mock — replace with API calls
  // when those endpoints exist in /oauth.
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
