/**
 * IndicatorBreakdown
 *
 * Per-process cards exposing the indicator-level detail behind the
 * process radar. For each ecosystem process, lists its contributing
 * EOV indicators sorted by absolute delta (biggest movers first),
 * with a 5-year sparkline and baseline → current change.
 *
 * This is the "why" view that drills into the "what" the radar shows.
 *
 * Layout: 2-column responsive grid of process cards.
 */

import { useMemo } from 'react'
import { buildIndicatorBreakdown, groupBreakdownByProcess } from '../../lib/indicatorBreakdown'
import { PROCESS_META, PROCESS_ORDER } from '../../lib/ehiProcesses'

export default function IndicatorBreakdown({ dataset, latest, trend }) {
  const { breakdown, byProcess } = useMemo(() => {
    const b = buildIndicatorBreakdown(dataset)
    return { breakdown: b, byProcess: groupBreakdownByProcess(b) }
  }, [dataset])

  if (!byProcess) {
    return (
      <div className="card p-4 text-xs text-gdt-slate-lt">
        Indicator-level breakdown needs a bundled dataset. None for this property yet.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-gdt-slate">Indicator breakdown by ecosystem process</h2>
        <span className="text-[10px] font-mono text-gdt-slate-lt">
          baseline {trend?.[0]?.year_label ?? 'Y0'} → current {latest?.year_label ?? 'now'} · strata-weighted
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {PROCESS_ORDER.map((proc) => {
          const inds = byProcess[proc] ?? []
          if (inds.length === 0) return null

          const procCurrent = latest?.process_indices?.[proc]
          const procBaseline = trend?.[0]?.process_indices?.[proc]
          const procDelta = (procCurrent != null && procBaseline != null)
            ? Math.round((procCurrent - procBaseline) * 10) / 10
            : null

          return (
            <ProcessCard
              key={proc}
              process={proc}
              indicators={inds}
              currentValue={procCurrent}
              baselineValue={procBaseline}
              delta={procDelta}
            />
          )
        })}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
function ProcessCard({ process, indicators, currentValue, baselineValue, delta }) {
  const meta = PROCESS_META[process]
  const deltaColour = deltaColourFor(delta)

  return (
    <div className="card p-4 flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-3 pb-3 border-b border-gdt-border">
        <div>
          <h3 className="text-sm font-semibold text-gdt-slate flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: meta.colour }} />
            {meta.label}
          </h3>
          <p className="text-[11px] text-gdt-slate-lt mt-0.5">
            {indicators.length} contributing {indicators.length === 1 ? 'indicator' : 'indicators'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-base font-semibold text-gdt-slate tabular-nums">
            {currentValue == null ? '—' : currentValue.toFixed(1)}
          </div>
          {delta != null && (
            <div className="text-[11px] font-medium tabular-nums" style={{ color: deltaColour }}>
              {delta > 0 ? '▲ +' : delta < 0 ? '▼ ' : '─ '}{Math.abs(delta).toFixed(1)}
              <span className="text-gdt-slate-lt font-normal"> vs {baselineValue?.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        {indicators.map((ind, i) => (
          <IndicatorRow key={ind.code} indicator={ind} isFirst={i === 0} />
        ))}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
function IndicatorRow({ indicator: ind, isFirst }) {
  const delta = ind.delta
  const deltaColour = deltaColourFor(delta)
  const isBigMover = delta != null && Math.abs(delta) >= 3

  return (
    <div
      className={`grid grid-cols-[36px_minmax(0,1fr)_60px_72px_56px] items-center gap-2 py-1.5 ${isFirst ? '' : 'border-t border-gdt-border'}`}
      title={`${ind.name} — range ${ind.min} to ${ind.max} (${ind.type})`}
    >
      <span className="text-[10px] font-mono text-gdt-slate-lt">{ind.code}</span>
      <span className="text-xs text-gdt-slate truncate">{ind.name.replace(/^FG\d\s+/, '')}</span>
      <Sparkline series={ind.series} min={ind.min} max={ind.max} accent={deltaColour} />
      <span className="text-[11px] font-mono text-gdt-slate-lt tabular-nums text-right">
        {fmt(ind.baseline)} → {fmt(ind.current)}
      </span>
      <span
        className="text-[11px] tabular-nums text-right"
        style={{ color: deltaColour, fontWeight: isBigMover ? 600 : 500 }}
      >
        {delta == null ? '—' : (delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1))}
      </span>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
 * Inline SVG sparkline. ~60×16 pixels. Plots `series` against the
 * indicator's own min/max so different-range indicators are comparable
 * by "where in their possible range" they sit.
 *
 * Adds a baseline guide at the 0 line (within the indicator's range)
 * if 0 is between min and max — many indicators are bipolar.
 * ────────────────────────────────────────────────────────────────────────── */
function Sparkline({ series, min, max, accent = '#888780', width = 60, height = 16 }) {
  if (!series?.length) return <span style={{ width, height, display: 'inline-block' }} />

  const span = Math.max(0.0001, max - min)
  const valid = series.map((v, i) => (v == null ? null : { i, v }))
                      .filter(Boolean)

  if (valid.length === 0) return <span style={{ width, height, display: 'inline-block' }} />

  // Map values into [0..1] then into pixel space
  const xStep = series.length > 1 ? (width - 2) / (series.length - 1) : 0
  const yFor = (v) => height - 2 - (((v - min) / span) * (height - 4))
  const xFor = (i) => 1 + i * xStep

  const points = valid.map(({ i, v }) => `${xFor(i)},${yFor(v)}`).join(' ')

  // Zero baseline (only meaningful for bipolar indicators)
  const zeroY = (min < 0 && max > 0) ? yFor(0) : null

  return (
    <svg
      width={width} height={height}
      role="img"
      aria-label={`Sparkline: ${series.map(v => v == null ? '—' : v.toFixed(1)).join(', ')}`}
      style={{ overflow: 'visible' }}
    >
      {zeroY != null && (
        <line x1={0} x2={width} y1={zeroY} y2={zeroY} stroke="#d1cfc7" strokeDasharray="1 2" />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={accent}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Endpoint dot — emphasise current value */}
      {valid.length > 0 && (() => {
        const last = valid[valid.length - 1]
        return <circle cx={xFor(last.i)} cy={yFor(last.v)} r={1.6} fill={accent} />
      })()}
    </svg>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
function deltaColourFor(d) {
  if (d == null || d === 0) return '#888780'
  if (d > 0) return '#0F6E56'  // gdt-green dark
  return '#A32D2D'             // gdt-red dark
}

function fmt(n) { return n == null ? '—' : n.toFixed(1) }
