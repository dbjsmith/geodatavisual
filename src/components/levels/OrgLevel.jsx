/**
 * OrgLevel — top-level org view.
 *
 * Expects ctx.org and (optionally) ctx.properties[].
 * In dev mode, shows just the current property as a single-card list.
 */

import IndicatorGrid from '../charts/IndicatorGrid'

export default function OrgLevel({ ctx }) {
  const org        = ctx?.org ?? {}
  const properties = ctx?.properties ?? (ctx?.property ? [ctx.property] : [])

  return (
    <div className="flex flex-col gap-5 p-5">
      <header>
        <div className="text-[11px] uppercase tracking-wider text-gdt-slate-lt">Organisation</div>
        <h1 className="text-xl font-semibold text-gdt-slate">{org.name ?? 'Untitled org'}</h1>
        <p className="text-sm text-gdt-slate-lt mt-1">
          {properties.length} {properties.length === 1 ? 'property' : 'properties'}
        </p>
      </header>

      <IndicatorGrid
        items={properties}
        title="Properties"
        emptyText="No properties available at this scope."
      />
    </div>
  )
}
