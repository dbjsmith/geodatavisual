/**
 * GeopointLevel — single monitoring point view.
 *
 * Shows the point's current EHI, location, and recent survey log.
 */

import EHIGauge   from '../charts/EHIGauge'
import TrendChart from '../charts/TrendChart'
import { mockTrend } from '../../lib/mockData'

export default function GeopointLevel({ ctx }) {
  const point   = ctx?.point   ?? ctx?.geopoint ?? {}
  const surveys = ctx?.surveys ?? []
  const trend   = ctx?.trend   ?? mockTrend

  return (
    <div className="flex flex-col gap-5 p-5">
      <header>
        <div className="text-[11px] uppercase tracking-wider text-gdt-slate-lt">Monitoring point</div>
        <h1 className="text-xl font-semibold text-gdt-slate">{point.name ?? 'Unnamed point'}</h1>
        {point.lat != null && point.lng != null && (
          <p className="text-xs font-mono text-gdt-slate-lt mt-1">
            {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
          </p>
        )}
      </header>

      <section className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
        <EHIGauge score={point.ehi} label="Point EHI" />
        <TrendChart data={trend} title="EHI history" />
      </section>

      <section className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gdt-slate">Recent surveys</h2>
          <span className="text-[11px] text-gdt-slate-lt">{surveys.length} total</span>
        </div>
        {surveys.length === 0 ? (
          <div className="text-sm text-gdt-slate-lt py-4 text-center">
            No surveys logged for this point yet.
          </div>
        ) : (
          <ul className="divide-y divide-gdt-border">
            {surveys.map((s) => (
              <li key={s._apikey ?? s.id} className="py-2 flex items-center justify-between text-sm">
                <span className="text-gdt-slate">{s.date} — {s.surveyor ?? 'Unknown'}</span>
                <span className="font-medium tabular-nums">{s.ehi?.toFixed(1) ?? '—'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
