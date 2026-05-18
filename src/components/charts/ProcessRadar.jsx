/**
 * ProcessRadar — radar chart of HPG-AI / ecological process indicators.
 *
 *   <ProcessRadar data={[{ indicator: 'Water cycle', score: 7.8 }, ...]} />
 */

import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip,
} from 'recharts'

export default function ProcessRadar({ data = [], height = 280, title = 'Ecological processes' }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-gdt-slate">{title}</div>
        <div className="text-[11px] text-gdt-slate-lt">0–10 scale</div>
      </div>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <RadarChart data={data} outerRadius="78%">
            <PolarGrid stroke="var(--gdt-border)" />
            <PolarAngleAxis
              dataKey="indicator"
              tick={{ fill: 'var(--gdt-slate)', fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 10]}
              tick={{ fill: 'var(--gdt-slate-lt)', fontSize: 10 }}
              axisLine={false}
            />
            <Radar
              name="EHI"
              dataKey="score"
              stroke="var(--gdt-green)"
              fill="var(--gdt-green-lt)"
              fillOpacity={0.45}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--gdt-card)',
                border: '1px solid var(--gdt-border)',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v) => [v.toFixed(1), 'score']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
