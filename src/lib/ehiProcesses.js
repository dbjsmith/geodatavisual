/**
 * ehiProcesses
 *
 * The four ecosystem processes from EOV / Holistic Management — these
 * are the radar axes. Each dataset survey carries per-process indices
 * (0-100 scale), normalised from the underlying indicator contributions.
 *
 * Ordering deliberately puts community last so a typical "water/mineral
 * good, community lagging" pattern reads left-to-right.
 */

export const PROCESS_ORDER = ['water', 'mineral', 'energy', 'community']

export const PROCESS_META = {
  water:     { label: 'Water Cycle',        short: 'Water',     colour: '#378ADD' },
  mineral:   { label: 'Mineral Cycle',      short: 'Mineral',   colour: '#BA7517' },
  energy:    { label: 'Energy Flow',        short: 'Energy',    colour: '#EF9F27' },
  community: { label: 'Community Dynamics', short: 'Community', colour: '#7F77DD' },
}

/**
 * Convert a `{ water, mineral, energy, community }` index map into the
 * array form Recharts' RadarChart wants: [{ axis, value }, …]
 */
export function processIndicesToRadarSeries(indices) {
  if (!indices) return []
  return PROCESS_ORDER
    .filter((p) => indices[p] != null)
    .map((p) => ({
      axis:    PROCESS_META[p].short,
      label:   PROCESS_META[p].label,
      value:   indices[p],
      colour:  PROCESS_META[p].colour,
      process: p,
    }))
}
