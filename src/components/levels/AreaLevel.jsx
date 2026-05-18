/**
 * AreaLevel — area-scoped view.
 *
 * Expects ctx.area, and uses mappingData (filtered) to show this area's points.
 */

import EHIGauge      from '../charts/EHIGauge'
import IndicatorGrid from '../charts/IndicatorGrid'
import MapView       from '../MapView'
import { useMappingData } from '../../hooks/useMappingData'

export default function AreaLevel({ ctx }) {
  const { mappingData, loading, error } = useMappingData(ctx)
  const area = ctx?.area ?? {}

  // Filter mapping data to this area only
  const filteredMapping = mappingData ? {
    properties: mappingData.properties,
    areas:      mappingData.areas?.filter(a => a._apikey === area._apikey),
    points:     mappingData.points?.filter(p => p.area_apikey === area._apikey),
  } : null

  const points = filteredMapping?.points ?? []

  return (
    <div className="flex flex-col gap-5 p-5">
      <header>
        <div className="text-[11px] uppercase tracking-wider text-gdt-slate-lt">Area</div>
        <h1 className="text-xl font-semibold text-gdt-slate">{area.name ?? 'Unnamed area'}</h1>
        <p className="text-sm text-gdt-slate-lt mt-1">
          {points.length} monitoring {points.length === 1 ? 'point' : 'points'}
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
        <EHIGauge score={area.ehi} label="Area EHI" />
        <div className="h-[260px]">
          <MapView mappingData={filteredMapping} loading={loading} error={error} />
        </div>
      </section>

      <IndicatorGrid items={points} title="Monitoring points" emptyText="No monitoring points in this area." />
    </div>
  )
}
