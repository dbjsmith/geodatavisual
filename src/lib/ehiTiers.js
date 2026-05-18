/**
 * ehiTiers
 *
 * EHI score interpretation tiers from EOV 3.0 manual, Chapter 5 page 130
 * (non-brittle environments — thresholds in brittle ecoregions may shift).
 *
 *   > 65    Strong       Functioning close to ecoregion potential
 *   30–65   Reasonable   Reasonable ecosystem function
 *   0–30    Moderate     Moderate departure from potential
 *   < 0     Degrading    Ineffective processes / degradation
 *
 * Default tiers can be overridden by the dataset's own `ehi_tiers` block
 * (the bundled BEL dataset uses the same defaults but other ecoregions
 * may calibrate differently).
 */

export const DEFAULT_EHI_TIERS = [
  { min:   65, max:  200, label: 'Strong',     description: 'Close to ecoregion potential',         colour: '#1D9E75' },
  { min:   30, max:   65, label: 'Reasonable', description: 'Reasonable ecosystem function',         colour: '#97C459' },
  { min:    0, max:   30, label: 'Moderate',   description: 'Moderate departure from potential',     colour: '#EF9F27' },
  { min: -200, max:    0, label: 'Degrading',  description: 'Ineffective processes / degradation',   colour: '#E24B4A' },
]

export function tierFor(score, tiers = DEFAULT_EHI_TIERS) {
  if (score == null || Number.isNaN(score)) return null
  for (const t of tiers) {
    // tiers are half-open at the top (so 65 → Strong, 30 → Reasonable)
    if (score >= t.min && score < t.max) return t
  }
  // Fallback: the worst tier (covers anything below the lowest min)
  return tiers[tiers.length - 1]
}

export function tierColour(score, tiers = DEFAULT_EHI_TIERS) {
  return tierFor(score, tiers)?.colour ?? '#888780'
}

export function tierLabel(score, tiers = DEFAULT_EHI_TIERS) {
  return tierFor(score, tiers)?.label ?? '—'
}
