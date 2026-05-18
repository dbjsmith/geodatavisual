/**
 * TrendChart — EHI trend over time.
 *
 *   <TrendChart data={[{ month: '2025-06', ehi: 6.1 }, ...]} />
 */

import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

export default function TrendChart({ data = [], height = 220, title = 'EHI trend' }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gdt-slate">{title}</div>
        <div className="text-[11px] text-gdt-slate-lt">12-month rolling</div>
      </div>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="var(--gdt-border)" strokeDasharray="2 4" />
            <XAxis
              dataKey="month"
              tick={{ fill: 'var(--gdt-slate-lt)', fontSize: 11 }}
              tickFormatter={fmtMonth}
              axisLine={{ stroke: 'var(--gdt-border)' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
              tick={{ fill: 'var(--gdt-slate-lt)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--gdt-card)',
                border: '1px solid var(--gdt-border)',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v) => [v.toFixed(1), 'EHI']}
              labelFormatter={fmtMonth}
            />
            <ReferenceLine y={5} stroke="var(--gdt-amber)" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="ehi"
              stroke="var(--gdt-green-mid)"
              strokeWidth={2.5}
              dot={{ fill: 'var(--gdt-green)', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function fmtMonth(m) {
  if (!m) return ''
  const [, mo] = m.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return months[parseInt(mo, 10) - 1] ?? m
}
