/**
 * IndicatorGrid — coloured tiles for areas (or any item with name + ehi).
 *
 *   <IndicatorGrid items={[{ name: 'North Pasture', ehi: 8.1, ... }]}
 *                  onSelect={(item) => ...} />
 */

import { ehiColor, ehiLabel } from '../../lib/colorScale'

export default function IndicatorGrid({ items = [], onSelect, title = 'Areas', emptyText = 'No areas.' }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gdt-slate">{title}</div>
        <div className="text-[11px] text-gdt-slate-lt">{items.length} total</div>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-gdt-slate-lt py-6 text-center">{emptyText}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {items.map((item) => {
            const colour = ehiColor(item.ehi)
            return (
              <button
                key={item._apikey ?? item.name}
                type="button"
                onClick={() => onSelect?.(item)}
                className="text-left rounded-lg border border-gdt-border bg-white p-3 hover:shadow-sm transition focus:outline-none focus:ring-2 focus:ring-gdt-green-lt"
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: colour }}
                  />
                  <span className="text-[10px] uppercase tracking-wider text-gdt-slate-lt">
                    {ehiLabel(item.ehi)}
                  </span>
                </div>
                <div className="text-sm font-medium text-gdt-slate truncate">
                  {item.name}
                </div>
                <div className="text-lg font-semibold tabular-nums" style={{ color: colour }}>
                  {item.ehi == null ? '—' : item.ehi.toFixed(1)}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
