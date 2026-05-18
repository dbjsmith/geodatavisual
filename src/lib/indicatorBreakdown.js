/**
 * indicatorBreakdown
 *
 * Two helpers:
 *
 *   buildIndicatorBreakdown(dataset)
 *     Strata-weighted property-level series per indicator (existing).
 *
 *   buildPerPointSeries(dataset, indicatorCode)
 *     Per-point time series for a single indicator. Used by the
 *     indicator drill-in to answer "FG3 crashed across the property —
 *     but did some points hold up?"
 *
 *   groupBreakdownByProcess(breakdown)
 *     Splits indicators into ecosystem-process buckets.
 */

import { PROCESS_ORDER } from './ehiProcesses'

/* ──────────────────────────────────────────────────────────────────────── */
export function buildIndicatorBreakdown(dataset) {
  if (!dataset?.surveys?.length || !dataset?.indicators?.length) return null

  const { surveys, indicators } = dataset
  const byYear = new Map()
  for (const s of surveys) {
    if (!byYear.has(s.year_offset)) byYear.set(s.year_offset, [])
    byYear.get(s.year_offset).push(s)
  }
  const yearOffsets = [...byYear.keys()].sort((a, b) => a - b)
  const yearLabels  = yearOffsets.map(o => byYear.get(o)[0].year_label)
  const yearDates   = yearOffsets.map(o => byYear.get(o)[0].date)

  const weightedAvg = (code, yearSurveys) => {
    let weightedSum = 0
    let totalStrata = 0
    let coveredPts  = 0
    for (const s of yearSurveys) {
      const v = s.indicators?.[code]
      if (v == null) continue
      weightedSum += v * s.strata_size_ha
      totalStrata += s.strata_size_ha
      coveredPts  += 1
    }
    return totalStrata
      ? { value: weightedSum / totalStrata, coverage: coveredPts / yearSurveys.length }
      : { value: null, coverage: 0 }
  }

  return indicators.map(ind => {
    const points = yearOffsets.map(o => weightedAvg(ind.code, byYear.get(o)))
    const series = points.map(p => p.value == null ? null : round2(p.value))
    const baseline = series[0]
    const current  = series[series.length - 1]
    const delta    = (baseline != null && current != null) ? round2(current - baseline) : null
    const coverage = Math.min(...points.map(p => p.coverage))

    return {
      ...ind,
      yearLabels,
      yearDates,
      series,
      baseline,
      current,
      delta,
      coverage,
    }
  })
}

/* ──────────────────────────────────────────────────────────────────────── */
/**
 * For a single indicator code, return one row per monitoring point with
 * that point's 5-year series + baseline/current/delta. Sorted by absolute
 * delta descending (biggest movers first) so "which points dropped the
 * most" reads at the top.
 *
 * Returns: [{ pointName, strataHa, series, yearLabels, baseline, current, delta }, …]
 */
export function buildPerPointSeries(dataset, indicatorCode) {
  if (!dataset?.surveys?.length || !indicatorCode) return null

  const byYear = new Map()
  for (const s of dataset.surveys) {
    if (!byYear.has(s.year_offset)) byYear.set(s.year_offset, [])
    byYear.get(s.year_offset).push(s)
  }
  const yearOffsets = [...byYear.keys()].sort((a, b) => a - b)
  const yearLabels  = yearOffsets.map(o => byYear.get(o)[0].year_label)
  const pointNames  = [...new Set(dataset.surveys.map(s => s.point_name))]

  return pointNames
    .map((name) => {
      const series = yearOffsets.map((o) => {
        const match = byYear.get(o).find(x => x.point_name === name)
        return match ? match.indicators?.[indicatorCode] ?? null : null
      })
      const baseline = series[0]
      const current  = series[series.length - 1]
      const delta    = (baseline != null && current != null) ? current - baseline : null
      const firstSurvey = dataset.surveys.find(s => s.point_name === name)
      return {
        pointName:  name,
        strataHa:   firstSurvey?.strata_size_ha ?? null,
        series,
        yearLabels,
        baseline,
        current,
        delta,
      }
    })
    .sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0))
}

/* ──────────────────────────────────────────────────────────────────────── */
export function groupBreakdownByProcess(breakdown) {
  if (!breakdown) return null
  const groups = {}
  for (const proc of PROCESS_ORDER) {
    groups[proc] = breakdown
      .filter(ind => ind.processes.includes(proc))
      .slice()
      .sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0))
  }
  return groups
}

function round2(n) { return Math.round(n * 100) / 100 }
