/**
 * Sparkline
 *
 * Tiny inline SVG line chart. Used in three places now (property-level
 * indicator rows, per-point indicator rows, and area ranking) — pulled
 * out here so they stay consistent.
 *
 * Pass the indicator's natural min/max so the line scales to its real
 * range (e.g. -10..+10 for FG indicators, -120..+120 for total EHI).
 * Auto-draws a zero baseline when the range is bipolar.
 */

export default function Sparkline({
  series,
  min,
  max,
  accent  = '#888780',
  width   = 60,
  height  = 16,
}) {
  if (!series?.length) {
    return <span style={{ width, height, display: 'inline-block' }} />
  }

  const span = Math.max(0.0001, max - min)
  const valid = series
    .map((v, i) => (v == null ? null : { i, v }))
    .filter(Boolean)

  if (valid.length === 0) {
    return <span style={{ width, height, display: 'inline-block' }} />
  }

  const xStep = series.length > 1 ? (width - 2) / (series.length - 1) : 0
  const yFor  = (v) => height - 2 - (((v - min) / span) * (height - 4))
  const xFor  = (i) => 1 + i * xStep

  const points = valid.map(({ i, v }) => `${xFor(i)},${yFor(v)}`).join(' ')
  const zeroY  = (min < 0 && max > 0) ? yFor(0) : null
  const last   = valid[valid.length - 1]

  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label={`Sparkline: ${series.map(v => v == null ? '—' : v).join(', ')}`}
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
      <circle cx={xFor(last.i)} cy={yFor(last.v)} r={1.6} fill={accent} />
    </svg>
  )
}
