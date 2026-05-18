/**
 * AreaRanking
 *
 * Ranks the property's monitoring points (one per area in the BEL model)
 * by current EHI score, descending. Each row shows the point name (with
 * GDT area name if matchable from mappingData), strata size, a tier-
 * coloured EHI badge, the 5-year sparkline, and the baseline → current
 * delta.
 *
 * Replaces the placeholder IndicatorGrid which was showing "UNSCORED"
 * area cards with no actual scores.
 *
 * Note: BEL is structured as one monitoring point per area, so this is
 * effectively a per-area ranking. Properties with multiple points per
 * area would want a more sophisticated aggregation (TODO when one shows
 * up in a future import sheet).
 */

import { useMemo } from 'react'
import { tierFor }  from '../../lib/ehiTiers'

export default function AreaRanking({
  dataset,
  mappingData,
  title = 'Areas ranked by EHI',
}) {
  /* Build point_name → area_name lookup from the API mapping data */
  const areaNameByPoint = useMemo(() => {
    if (!mappingData?.points) return {}
    const lookup = {}
    for (const p of mappingData.points) {
      if (p.name && p.area_name) lookup[p.name] = p.area_name
    }
    return lookup
  }, [mappingData])

  /* Build ranked rows from dataset surveys */
  const rows = useMemo(() => {
    if (!dataset?.surveys?.length) return null

    const byYear = new Map()
    for (const s of dataset.surveys) {
      if (!byYear.has(s.year_offset)) byYear.set(s.year_offset, [])
      byYear.get(s.year_offset).push(s)
    }
    const yearOffsets = [...byYear.keys()].sort((a, b) => a - b)
    const yearLabels  = yearOffsets.map(o => byYear.get(o)[0].year_label)

    const pointNames = [...new Set(dataset.surveys.map(s => s.point_name))]

    return pointNames
      .map((name) => {
        const series = yearOffsets.map((o) => {
          const match = byYear.get(o).find(x => x.point_name === name)
          return match ? match.ehi : null
        })
        const baseline = series[0]
        const current  = series[series.length - 1]
        const delta    = (baseline != null && current != null) ? current - baseline : null
        const firstSurvey = dataset.surveys.find(s => s.point_name === name)
        return {
          name,
          areaName:   areaNameByPoint[name] ?? null,
          strataHa:   firstSurvey?.strata_size_ha ?? null,
          series,
          yearLabels,
          baseline,
          current,
          delta,
        }
      })
      .sort((a, b) => (b.current ?? -Infinity) - (a.current ?? -Infinity))
  }, [dataset, areaNameByPoint])

  if (!rows) {
    return (
      <div className="card p-4 text-xs text-gdt-slate-lt">
        Area ranking needs a bundled dataset. None for this property yet.
      </div>
    )
  }

  const totalHa = rows.reduce((sum, r) => sum + (r.strataHa ?? 0), 0)

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 className="text-sm font-semibold text-gdt-slate">{title}</h2>
        <span className="text-[10px] font-mono text-gdt-slate-lt">
          {rows.length} {rows.length === 1 ? 'monitoring point' : 'monitoring points'} · {totalHa} ha
        </span>
      </div>

      <div className="flex flex-col">
        {rows.map((row, i) => (
          <AreaRow
            key={row.name}
            row={row}
            rank={i + 1}
            totalHa={totalHa}
            isFirst={i === 0}
          />
        ))}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
function AreaRow({ row, rank, totalHa, isFirst }) {
  const tier        = tierFor(row.current)
  const deltaColour = deltaColourFor(row.delta)
  const isBigMover  = row.delta != null && Math.abs(row.delta) >= 15
  const haPct       = totalHa ? Math.round((row.strataHa / totalHa) * 100) : null

  return (
    <div
      className={[
        'grid items-center gap-3 py-2',
        'grid-cols-[20px_minmax(0,1fr)_64px_64px_80px_60px]',
        isFirst ? '' : 'border-t border-gdt-border',
      ].join(' ')}
      title={`${row.name}${row.areaName ? ` — ${row.areaName}` : ''} · ${row.strataHa}ha (${haPct}% of monitored)`}
    >
      <span className="text-[10px] font-mono text-gdt-slate-lt tabular-nums text-right">
        {rank}
      </span>

      <div className="flex flex-col min-w-0">
        <span className="text-xs font-medium text-gdt-slate truncate">{row.name}</span>
        {row.areaName && (
          <span className="text-[10px] text-gdt-slate-lt truncate">{row.areaName}</span>
        )}
      </div>

      <span className="text-[11px] font-mono text-gdt-slate-lt tabular-nums text-right">
        {row.strataHa != null ? `${row.strataHa} ha` : '—'}
      </span>

      {/* EHI tier badge */}
      <span
        className="text-xs font-semibold tabular-nums text-center px-2 py-1 rounded"
        style={{
          backgroundColor: tier ? tier.colour + '22' : '#88878018',
          color:           tier?.colour ?? '#888780',
        }}
        title={tier ? `${tier.label}: ${tier.description}` : 'Unscored'}
      >
        {row.current == null ? '—' : Math.round(row.current)}
      </span>

      <Sparkline series={row.series} accent={deltaColour} />

      <span
        className="text-[11px] tabular-nums text-right"
        style={{ color: deltaColour, fontWeight: isBigMover ? 600 : 500 }}
      >
        {row.delta == null
          ? '—'
          : row.delta > 0
            ? `▲ +${row.delta}`
            : row.delta < 0
              ? `▼ ${row.delta}`
              : '─ 0'}
      </span>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Inline SVG sparkline scaled to EHI's full envelope, with zero line.    */
function Sparkline({ series, accent = '#888780', width = 80, height = 20 }) {
  if (!series?.length) return <span style={{ width, height, display: 'inline-block' }} />

  // Fixed envelope matches the trend chart's y-axis
  const min = -120
  const max =  120
  const span = max - min

  const valid = series
    .map((v, i) => (v == null ? null : { i, v }))
    .filter(Boolean)

  if (valid.length === 0) {
    return <span style={{ width, height, display: 'inline-block' }} />
  }

  const xStep = series.length > 1 ? (width - 4) / (series.length - 1) : 0
  const yFor  = (v) => height - 2 - (((v - min) / span) * (height - 4))
  const xFor  = (i) => 2 + i * xStep
  const zeroY = yFor(0)
  const points = valid.map(({ i, v }) => `${xFor(i)},${yFor(v)}`).join(' ')

  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label={`Sparkline: ${series.map(v => v == null ? '—' : v).join(', ')}`}
      style={{ overflow: 'visible' }}
    >
      <line x1={0} x2={width} y1={zeroY} y2={zeroY} stroke="#d1cfc7" strokeDasharray="1 2" />
      <polyline
        points={points}
        fill="none"
        stroke={accent}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {valid.length > 0 && (() => {
        const last = valid[valid.length - 1]
        return <circle cx={xFor(last.i)} cy={yFor(last.v)} r={1.8} fill={accent} />
      })()}
    </svg>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
function deltaColourFor(d) {
  if (d == null || d === 0) return '#888780'
  if (d > 0) return '#0F6E56'
  return '#A32D2D'
}
