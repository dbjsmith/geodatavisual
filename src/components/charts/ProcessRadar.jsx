/**
 * ProcessRadar — 4-axis ecosystem process visualisation.
 *
 * Axes: Water Cycle, Mineral Cycle, Energy Flow, Community Dynamics.
 * Each value is a 0-100 normalised composite of the indicators that
 * contribute to that process (see lib/ehiProcesses for the mapping).
 *
 * Data input shape — { water, mineral, energy, community } (any null
 * means "no data for this process this period").
 *
 * Optionally accepts a second `compare` map (e.g. baseline year) so the
 * radar can show current-vs-baseline as two overlaid traces.
 */

import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Legend, Tooltip,
} from 'recharts'

import { processIndicesToRadarSeries, PROCESS_META } from '../../lib/ehiProcesses'

export default function ProcessRadar({
  indices,
  compare       = null,
  title         = 'Ecosystem processes',
  currentLabel  = 'Current',
  compareLabel  = 'Baseline',
  source,
}) {
  const currentSeries = processIndicesToRadarSeries(indices)
  const has = currentSeries.length > 0

  // Merge two index maps into the shape Recharts wants for two-series radars
  const mergedSeries = currentSeries.map((row) => ({
    axis:   row.axis,
    label:  row.label,
    current: row.value,
    compare: compare ? compare[row.process] ?? null : null,
  }))

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <h2 className="text-sm font-semibold text-gdt-slate">{title}</h2>
        {source && <span className="text-[10px] font-mono text-gdt-slate-lt">{source}</span>}
      </div>

      {!has && (
        <div className="h-48 flex items-center justify-center text-xs text-gdt-slate-lt">
          No indicator data available.
        </div>
      )}

      {has && (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={mergedSeries} outerRadius="75%">
              <PolarGrid stroke="#e2ede8" />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: '#2d3748' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#718096' }} />

              {compare && (
                <Radar
                  name={compareLabel}
                  dataKey="compare"
                  stroke="#888780"
                  fill="#888780"
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  isAnimationActive={false}
                />
              )}

              <Radar
                name={currentLabel}
                dataKey="current"
                stroke="#2d6a4f"
                fill="#2d6a4f"
                fillOpacity={0.35}
                strokeWidth={2}
                isAnimationActive={false}
              />

              <Tooltip
                contentStyle={{
                  fontSize: 12, background: 'white',
                  border: '1px solid #e2ede8', borderRadius: 8,
                }}
                formatter={(value) => (value == null ? '—' : Math.round(value * 10) / 10)}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} iconSize={10} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-axis numeric readout */}
      {has && (
        <div className="mt-3 pt-3 border-t border-gdt-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
          {currentSeries.map((row) => (
            <div key={row.process} className="flex flex-col">
              <span className="text-gdt-slate-lt">{row.label}</span>
              <span className="text-gdt-slate font-semibold tabular-nums">
                {row.value == null ? '—' : Math.round(row.value * 10) / 10}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
