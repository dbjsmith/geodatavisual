/**
 * EHIGauge — single-value EHI display with EOV tier banding.
 *
 * Score scale: -120 to +120 (EOV non-brittle theoretical bounds).
 * Tier colour comes from ehiTiers (Strong / Reasonable / Moderate / Degrading).
 * Renders a compact card with the score, tier label, and a horizontal
 * mini-axis showing where the score sits in the full range with tier
 * background bands.
 */

import { tierFor, DEFAULT_EHI_TIERS } from '../../lib/ehiTiers'

// Theoretical EOV scoring envelope per Chapter 1 p15
const AXIS_MIN = -120
const AXIS_MAX =  120

function scoreToPercent(score) {
  if (score == null) return 50
  const t = (score - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)
  return Math.max(0, Math.min(1, t)) * 100
}

export default function EHIGauge({ score, label = 'EHI', tiers = DEFAULT_EHI_TIERS, sublabel }) {
  const tier = tierFor(score, tiers)
  const hasScore = score != null && !Number.isNaN(score)

  return (
    <div className="card p-4 flex flex-col gap-2.5">
      <div className="text-[11px] uppercase tracking-wider text-gdt-slate-lt">{label}</div>

      <div className="flex items-baseline gap-2.5">
        <div
          className="text-3xl font-semibold tabular-nums"
          style={{ color: hasScore ? tier?.colour ?? 'var(--color-gdt-slate)' : 'var(--color-gdt-slate-lt)' }}
        >
          {hasScore ? Math.round(score * 10) / 10 : '—'}
        </div>
        {hasScore && tier && (
          <div className="text-sm font-medium" style={{ color: tier.colour }}>
            {tier.label}
          </div>
        )}
        {!hasScore && (
          <div className="text-sm text-gdt-slate-lt">Unscored</div>
        )}
      </div>

      {sublabel && (
        <div className="text-[11px] text-gdt-slate-lt">{sublabel}</div>
      )}

      {/* Mini-axis with tier bands */}
      <div className="relative h-2 mt-1 rounded overflow-hidden">
        {tiers.map((t, i) => {
          const left  = scoreToPercent(t.min)
          const right = scoreToPercent(t.max)
          return (
            <div
              key={i}
              className="absolute top-0 bottom-0 opacity-30"
              style={{
                left:            `${left}%`,
                width:           `${Math.max(0, right - left)}%`,
                backgroundColor: t.colour,
              }}
              title={`${t.label}: ${t.min} to ${t.max}`}
            />
          )
        })}
        {hasScore && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gdt-slate"
            style={{ left: `${scoreToPercent(score)}%`, transform: 'translateX(-50%)' }}
          />
        )}
      </div>

      <div className="flex justify-between text-[10px] font-mono text-gdt-slate-lt">
        <span>{AXIS_MIN}</span>
        <span>0</span>
        <span>{AXIS_MAX}</span>
      </div>
    </div>
  )
}
