/**
 * TrendChart — multi-year EHI trend.
 *
 * Data input shape:
 *   [
 *     { year_label, date, property_ehi_weighted, point_count, ... },
 *     ...
 *   ]
 *
 * Renders the strata-weighted property EHI as a bold line, on a y-axis
 * banded by EOV tier colours (Strong / Reasonable / Moderate / Degrading).
 * Falls back to a single "no data" state when `data` is empty.
 *
 * Built with Recharts (already in package.json from the original GDV).
 */

import {
  ResponsiveContainer, ComposedChart, Line, ReferenceArea, ReferenceLine,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'

import { DEFAULT_EHI_TIERS, tierColour } from '../../lib/ehiTiers'

const Y_MIN = -120
const Y_MAX =  120

export default function TrendChart({ data, title = 'EHI trend', tiers = DEFAULT_EHI_TIERS, source }) {
  const has = Array.isArray(data) && data.length > 0

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 className="text-sm font-semibold text-gdt-slate">{title}</h2>
        {source && <span className="text-[10px] font-mono text-gdt-slate-lt">{source}</span>}
      </div>

      {!has && (
        <div className="h-48 flex items-center justify-center text-xs text-gdt-slate-lt">
          No trend data available.
        </div>
      )}

      {has && (
        <div className="h-56 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 12 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#e2ede8" vertical={false} />

              {/* Tier background bands — drawn in y-space */}
              {tiers.map((t, i) => (
                <ReferenceArea
                  key={i}
                  y1={Math.max(t.min, Y_MIN)}
                  y2={Math.min(t.max, Y_MAX)}
                  fill={t.colour}
                  fillOpacity={0.10}
                  ifOverflow="visible"
                  stroke="none"
                />
              ))}

              {/* Zero line */}
              <ReferenceLine y={0} stroke="#888780" strokeDasharray="3 3" />

              <XAxis
                dataKey="year_label"
                tick={{ fontSize: 11, fill: '#718096' }}
                tickLine={false} axisLine={{ stroke: '#e2ede8' }}
              />
              <YAxis
                domain={[Y_MIN, Y_MAX]}
                ticks={[-120, -60, 0, 30, 65, 120]}
                tick={{ fontSize: 11, fill: '#718096' }}
                tickLine={false} axisLine={{ stroke: '#e2ede8' }}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12, background: 'white',
                  border: '1px solid #e2ede8', borderRadius: 8,
                }}
                formatter={(value, _name, item) => {
                  const tierLabel = tierColour(value, tiers)
                  return [value, 'Property EHI (weighted)']
                }}
                labelFormatter={(label, payload) => {
                  const row = payload?.[0]?.payload
                  if (!row) return label
                  return `${label} · ${row.date} · ${row.point_count} pts`
                }}
              />

              <Line
                type="monotone"
                dataKey="property_ehi_weighted"
                stroke="#2d6a4f"
                strokeWidth={3}
                dot={(props) => {
                  const v = props.payload?.property_ehi_weighted
                  return (
                    <circle
                      cx={props.cx} cy={props.cy} r={5}
                      fill={tierColour(v, tiers)}
                      stroke="white" strokeWidth={2}
                    />
                  )
                }}
                activeDot={{ r: 7 }}
                isAnimationActive={false}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tier legend */}
      <div className="mt-3 pt-3 border-t border-gdt-border flex flex-wrap gap-x-4 gap-y-1.5 text-[11px]">
        {tiers.map((t) => (
          <div key={t.label} className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: t.colour, opacity: 0.6 }} />
            <span className="text-gdt-slate-lt">
              <span className="text-gdt-slate font-medium">{t.label}</span>
              <span className="ml-1 font-mono">{t.min === -200 ? '<0' : t.max === 200 ? `≥${t.min}` : `${t.min}–${t.max}`}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
