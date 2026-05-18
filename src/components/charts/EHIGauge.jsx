/**
 * EHIGauge — circular gauge showing EHI score (0–10) coloured by band.
 *
 *   <EHIGauge score={7.4} label="Property EHI" />
 */

import { ehiColor, ehiLabel } from '../../lib/colorScale'

export default function EHIGauge({ score, label = 'EHI', size = 140 }) {
  const safe = score == null || Number.isNaN(score) ? 0 : Math.max(0, Math.min(10, score))
  const pct  = safe / 10

  const r           = size / 2 - 12
  const c           = 2 * Math.PI * r
  const offset      = c * (1 - pct)
  const colour      = ehiColor(score)
  const labelText   = ehiLabel(score)

  return (
    <div className="card p-4 flex flex-col items-center justify-center">
      <div className="text-[11px] uppercase tracking-wider text-gdt-slate-lt mb-2">
        {label}
      </div>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="var(--gdt-border)" strokeWidth="10" fill="none"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={colour} strokeWidth="10" fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
        />
      </svg>
      <div className="-mt-[88px] flex flex-col items-center pointer-events-none">
        <div className="text-3xl font-semibold tabular-nums" style={{ color: colour }}>
          {score == null ? '—' : safe.toFixed(1)}
        </div>
        <div className="text-[11px] font-medium" style={{ color: colour }}>
          {labelText}
        </div>
      </div>
      <div style={{ height: 56 }} />
    </div>
  )
}
