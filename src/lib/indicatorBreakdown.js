/**
 * indicatorBreakdown
 *
 * Computes, for each EOV indicator, its strata-size-weighted property
 * average per year across the bundled dataset. Produces baseline →
 * current deltas plus the full year-by-year series, so a sparkline can
 * show whether a change was gradual or abrupt.
 *
 * Strata weighting matters: a 154 ha point pulls the property mean more
 * than a 5 ha point, and per-indicator deltas should respect that.
 *
 * Per-indicator entry shape:
 *   {
 *     code:        'FG3',
 *     name:        'FG3 Forbs & Legumes',
 *     processes:   ['community'],
 *     min:         -10,
 *     max:          10,
 *     yearLabels:  ['Baseline (Y0)', 'Year 1 (Y1)', …],
 *     series:      [7.67, 5.67, 5.49, 7.64, 1.21],
 *     baseline:    7.67,
 *     current:     1.21,
 *     delta:       -6.46,
 *     coverage:    1.0,     // fraction of points with non-null data
 *   }
 */

import { PROCESS_ORDER } from './ehiProcesses'

export function buildIndicatorBreakdown(dataset) {
  if (!dataset?.surveys?.length || !dataset?.indicators?.length) return null

  const { surveys, indicators } = dataset

  // Group surveys by year_offset so each year's strata-weighted average
  // is computed against that year's set of points.
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
    // Worst coverage in any year tells us how trustworthy the trend is overall
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

/**
 * Group indicators by ecosystem process, sorted by absolute delta within
 * each group (biggest changes first). An indicator that contributes to
 * multiple processes appears in multiple groups.
 */
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
