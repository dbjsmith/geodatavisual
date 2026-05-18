/**
 * IndicatorBreakdown
 *
 * Per-process cards showing EOV indicators driving each process score.
 * Each indicator row is now clickable: tap to expand a per-point
 * breakdown beneath it, showing which monitoring points are driving
 * the property-level change.
 *
 * State model: a Set of expanded indicator codes lives at the component
 * root, so any number of rows can be open at once. The same indicator
 * code expanded in two different process cards (e.g. BS in water and
 * mineral) opens independently — keyed by `${process}:${code}`.
 */

import { useMemo, useState, useCallback } from 'react'
import {
  buildIndicatorBreakdown,
  groupBreakdownByProcess,
  buildPerPointSeries,
} from '../../lib/indicatorBreakdown'
import { PROCESS_META, PROCESS_ORDER } from '../../lib/ehiProcesses'
import Sparkline from './Sparkline'

export default function IndicatorBreakdown({ dataset, latest, trend }) {
  const { breakdown, byProcess } = useMemo(() => {
    const b = buildIndicatorBreakdown(dataset)
    return { breakdown: b, byProcess: groupBreakdownByProcess(b) }
  }, [dataset])

  const [expandedKeys, setExpandedKeys] = useState(() => new Set())
  const toggle = useCallback((key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }, [])

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
          baseline {trend?.[0]?.year_label ?? 'Y0'} → current {latest?.year_label ?? 'now'} · strata-weighted · click a row for per-point detail
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {PROCESS_ORDER.map((proc) => {
          const inds = byProcess[proc] ?? []
          if (inds.length === 0) return null

          const procCurrent  = latest?.process_indices?.[proc]
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
              expandedKeys={expandedKeys}
              onToggle={toggle}
              dataset={dataset}
            />
          )
        })}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
function ProcessCard({
  process, indicators, currentValue, baselineValue, delta,
  expandedKeys, onToggle, dataset,
}) {
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
        {indicators.map((ind, i) => {
          const key = `${process}:${ind.code}`
          const isOpen = expandedKeys.has(key)
          return (
            <IndicatorRow
              key={key}
              indicator={ind}
              isFirst={i === 0}
              isOpen={isOpen}
              onToggle={() => onToggle(key)}
              dataset={dataset}
            />
          )
        })}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
function IndicatorRow({ indicator: ind, isFirst, isOpen, onToggle, dataset }) {
  const delta = ind.delta
  const deltaColour = deltaColourFor(delta)
  const isBigMover = delta != null && Math.abs(delta) >= 3

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className={[
          'w-full grid items-center gap-2 py-1.5 px-1 -mx-1 rounded',
          'grid-cols-[12px_30px_minmax(0,1fr)_60px_72px_56px]',
          'hover:bg-gdt-bg/60 cursor-pointer text-left transition-colors',
          isFirst ? '' : 'border-t border-gdt-border',
        ].join(' ')}
        title={`${ind.name} — range ${ind.min} to ${ind.max} (${ind.type}) · click for per-point`}
        aria-expanded={isOpen}
      >
        <span
          className="text-[9px] text-gdt-slate-lt transition-transform"
          style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
          aria-hidden="true"
        >
          ▶
        </span>
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
      </button>

      {isOpen && (
        <PerPointBreakdown indicator={ind} dataset={dataset} />
      )}
    </>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
 * PerPointBreakdown — sub-rows of monitoring points for one indicator.
 * Sorted by absolute delta so biggest movers come first.
 * ────────────────────────────────────────────────────────────────────────── */
function PerPointBreakdown({ indicator: ind, dataset }) {
  const rows = useMemo(
    () => buildPerPointSeries(dataset, ind.code),
    [dataset, ind.code],
  )

  if (!rows || rows.length === 0) {
    return (
      <div className="bg-gdt-bg/50 -mx-3 px-4 py-2 border-y border-gdt-border text-[11px] text-gdt-slate-lt">
        No per-point data.
      </div>
    )
  }

  return (
    <div className="bg-gdt-bg/40 -mx-3 px-4 py-2 border-y border-gdt-border">
      <div className="text-[9px] uppercase tracking-wider text-gdt-slate-lt mb-1.5">
        Per-point · sorted by absolute change
      </div>
      <div className="flex flex-col">
        {rows.map((row, i) => (
          <PerPointRow
            key={row.pointName}
            row={row}
            indicator={ind}
            isFirst={i === 0}
          />
        ))}
      </div>
    </div>
  )
}

function PerPointRow({ row, indicator: ind, isFirst }) {
  const deltaColour = deltaColourFor(row.delta)
  const isBigMover  = row.delta != null && Math.abs(row.delta) >= 5

  return (
    <div
      className={[
        'grid items-center gap-2 py-1',
        'grid-cols-[minmax(0,1fr)_42px_60px_58px_38px]',
        isFirst ? '' : 'border-t border-gdt-border/60',
      ].join(' ')}
      title={`${row.pointName} · ${row.strataHa}ha · ${row.yearLabels.map((y, i) => `${y}: ${row.series[i] ?? '—'}`).join(' · ')}`}
    >
      <span className="text-[11px] text-gdt-slate truncate">{row.pointName}</span>
      <span className="text-[10px] font-mono text-gdt-slate-lt tabular-nums text-right">
        {row.strataHa != null ? `${row.strataHa}ha` : '—'}
      </span>
      <Sparkline series={row.series} min={ind.min} max={ind.max} accent={deltaColour} />
      <span className="text-[10px] font-mono text-gdt-slate-lt tabular-nums text-right">
        {fmtInt(row.baseline)} → {fmtInt(row.current)}
      </span>
      <span
        className="text-[10px] tabular-nums text-right"
        style={{ color: deltaColour, fontWeight: isBigMover ? 600 : 500 }}
      >
        {row.delta == null ? '—' : (row.delta > 0 ? `+${row.delta}` : `${row.delta}`)}
      </span>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
function deltaColourFor(d) {
  if (d == null || d === 0) return '#888780'
  if (d > 0) return '#0F6E56'  // gdt-green dark
  return '#A32D2D'             // gdt-red dark
}

function fmt(n)    { return n == null ? '—' : n.toFixed(1) }
function fmtInt(n) { return n == null ? '—' : Math.round(n) }
