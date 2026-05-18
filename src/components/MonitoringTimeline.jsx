/**
 * MonitoringTimeline
 *
 * Horizontal activity timeline for every monitoring point in a property.
 *
 *   ─────  2021  ──  2022  ──  2023  ──  2024  ──  2025  ─────
 *   E3            ●         ●          ●          ●
 *   LL2                      ●                     ●
 *   LL3
 *   …
 *
 * Each row corresponds to one point. Dots are coloured by survey type.
 * Hover a dot for full survey detail. Rows are sorted by most recent
 * activity first.
 *
 * Pure HTML+CSS layout (Tailwind v4) — positioned absolutely against the
 * row track using percent-based x coordinates derived from the survey
 * date relative to the data's date range.
 */

import { useMemo } from 'react'

/* ──────────────────────────────────────────────────────────────────────── */
/* Survey-type → colour map.                                                */
/* Anything not in here falls back to a neutral grey. Built using the GDT   */
/* palette tokens defined in src/index.css.                                 */
/* ──────────────────────────────────────────────────────────────────────── */
const TYPE_COLOURS = {
  'Short Term Monitoring with Forage Assessment': 'var(--color-gdt-green-mid)',
  'Property Annual Information Update':           'var(--color-gdt-amber)',
  'Continuous Improvement Loop Survey':           'var(--color-gdt-green-lt)',
  'Property Set Up Survey':                       'var(--color-gdt-slate-lt)',
  'Property Mapping Survey':                      'var(--color-gdt-slate-lt)',
}
const FALLBACK_COLOUR = 'var(--color-gdt-slate)'
const colourFor = (type) => TYPE_COLOURS[type] ?? FALLBACK_COLOUR

/* ──────────────────────────────────────────────────────────────────────── */
export default function MonitoringTimeline({ rows, loading, error, debug }) {
  /* ── all hooks first (must run on every render) ────────────────────── */
  const allSurveys = useMemo(
    () => (rows ?? []).flatMap((r) => r.surveys),
    [rows],
  )
  const allDates = useMemo(
    () => allSurveys.map((s) => s.date).filter(Boolean),
    [allSurveys],
  )

  const { startDate, endDate, yearTicks } = useMemo(() => {
    if (allDates.length === 0) {
      return { startDate: null, endDate: null, yearTicks: [] }
    }
    const minMs = Math.min(...allDates.map((d) => d.getTime()))
    const maxMs = Math.max(...allDates.map((d) => d.getTime()))
    // Pad range by 3 months on each side so dots never sit on the edges
    const padMs = 1000 * 60 * 60 * 24 * 90
    const s = new Date(minMs - padMs)
    const e = new Date(maxMs + padMs)

    const ticks = []
    const startYear = s.getFullYear() + (s.getMonth() > 0 ? 1 : 0)
    const endYear   = e.getFullYear()
    for (let y = startYear; y <= endYear; y++) {
      const tickDate = new Date(y, 0, 1)
      const t = (tickDate.getTime() - s.getTime()) / (e.getTime() - s.getTime())
      ticks.push({ year: y, xPct: t * 100 })
    }
    return { startDate: s, endDate: e, yearTicks: ticks }
  }, [allDates])

  const dateToXPct = (date) => {
    if (!startDate || !endDate || !date) return 0
    const t = (date.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())
    return Math.max(0, Math.min(100, t * 100))
  }

  const sortedRows = useMemo(() => {
    if (!rows) return []
    return [...rows].sort((a, b) => {
      const aLatest = a.surveys.length
        ? Math.max(...a.surveys.map((s) => s.date?.getTime() ?? 0))
        : 0
      const bLatest = b.surveys.length
        ? Math.max(...b.surveys.map((s) => s.date?.getTime() ?? 0))
        : 0
      return bLatest - aLatest
    })
  }, [rows])

  const typesPresent = useMemo(() => {
    const set = new Set(allSurveys.map((s) => s.type))
    return [...set]
  }, [allSurveys])

  /* ── early-return UI states ────────────────────────────────────────── */
  if (error) {
    return (
      <Card>
        <Header debug={debug} />
        <div className="text-gdt-red text-xs">Couldn't load timeline: {error}</div>
      </Card>
    )
  }

  if (loading && !rows) {
    return (
      <Card>
        <Header debug={debug} />
        <div className="text-gdt-slate-lt text-xs">Loading survey history…</div>
      </Card>
    )
  }

  if (!rows || rows.length === 0) {
    return (
      <Card>
        <Header debug={debug} />
        <div className="text-gdt-slate-lt text-xs">No monitoring points to display yet.</div>
      </Card>
    )
  }

  if (allSurveys.length === 0) {
    return (
      <Card>
        <Header debug={debug} />
        <div className="text-gdt-slate-lt text-xs">
          No surveys recorded yet across {rows.length}{' '}
          {rows.length === 1 ? 'monitoring point' : 'monitoring points'}.
        </div>
      </Card>
    )
  }

  /* ── main render ───────────────────────────────────────────────────── */
  const totalSurveys = allSurveys.length

  return (
    <Card>
      <Header
        debug={debug}
        right={
          <span className="text-[11px] text-gdt-slate-lt">
            {totalSurveys} {totalSurveys === 1 ? 'survey' : 'surveys'} ·{' '}
            {sortedRows.length} {sortedRows.length === 1 ? 'point' : 'points'}
          </span>
        }
      />

      {/* Year axis */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-28 flex-shrink-0" />
        <div className="relative flex-1 h-5 border-b border-gdt-border">
          {yearTicks.map((t) => (
            <div
              key={t.year}
              className="absolute top-0 text-[11px] font-mono text-gdt-slate-lt"
              style={{ left: `${t.xPct}%`, transform: 'translateX(-50%)' }}
            >
              {t.year}
            </div>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-1.5">
        {sortedRows.map((row) => (
          <TimelineRow
            key={row.point._apikey}
            row={row}
            yearTicks={yearTicks}
            dateToXPct={dateToXPct}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gdt-border flex flex-wrap gap-x-4 gap-y-1.5 text-[11px]">
        {typesPresent.map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full ring-2 ring-white"
              style={{ backgroundColor: colourFor(type) }}
            />
            <span className="text-gdt-slate-lt">{type}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
function TimelineRow({ row, yearTicks, dateToXPct }) {
  const isEmpty = row.surveys.length === 0
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-28 flex-shrink-0 text-xs truncate"
        title={`${row.point.name}${row.point.area_name ? ` · ${row.point.area_name}` : ''}`}
      >
        <span className={isEmpty ? 'text-gdt-slate-lt' : 'text-gdt-slate'}>
          {row.point.name}
        </span>
      </div>
      <div className="relative flex-1 h-6 bg-gdt-bg rounded">
        {/* Faint vertical year guidelines */}
        {yearTicks.map((t) => (
          <div
            key={t.year}
            className="absolute top-0 bottom-0 w-px bg-gdt-border"
            style={{ left: `${t.xPct}%` }}
          />
        ))}

        {/* Survey dots */}
        {row.surveys.map((s) => (
          <div
            key={s._apikey ?? `${s.dateRaw}-${s.point_apikey}`}
            className="absolute top-1/2 w-3 h-3 rounded-full ring-2 ring-white cursor-pointer transition-transform hover:scale-150 hover:z-10"
            style={{
              left:            `${dateToXPct(s.date)}%`,
              transform:       'translate(-50%, -50%)',
              backgroundColor: colourFor(s.type),
            }}
            title={`${s.dateISO} — ${s.type}\nArea: ${s.area_name ?? '—'}\nPoint: ${s.point_name ?? row.point.name}`}
          />
        ))}

        {/* Error indicator on the row */}
        {row.error && (
          <div
            className="absolute top-1/2 right-1 text-gdt-red text-[10px]"
            style={{ transform: 'translateY(-50%)' }}
            title={row.error}
          >
            ⚠
          </div>
        )}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
function Card({ children }) {
  return <div className="card p-4">{children}</div>
}

function Header({ debug, right }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-semibold text-gdt-slate">Monitoring Timeline</h2>
        {debug?.elapsedMs != null && (
          <span className="text-[10px] font-mono text-gdt-slate-lt">
            {debug.elapsedMs}ms · {debug.totalSurveys ?? 0} surveys
          </span>
        )}
      </div>
      {right}
    </div>
  )
}
