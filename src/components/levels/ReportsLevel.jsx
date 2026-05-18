/**
 * ReportsLevel — reports & exports view.
 *
 * Placeholder scaffold — wire to /oauth/reports when that endpoint exists.
 */

import { FileText, Download } from 'lucide-react'

export default function ReportsLevel({ ctx }) {
  const reports = ctx?.reports ?? []

  return (
    <div className="flex flex-col gap-5 p-5">
      <header>
        <div className="text-[11px] uppercase tracking-wider text-gdt-slate-lt">Reports</div>
        <h1 className="text-xl font-semibold text-gdt-slate">
          {ctx?.property?.name ? `${ctx.property.name} — Reports` : 'Reports'}
        </h1>
        <p className="text-sm text-gdt-slate-lt mt-1">
          {reports.length} available
        </p>
      </header>

      <section className="card p-4">
        {reports.length === 0 ? (
          <div className="text-sm text-gdt-slate-lt py-8 text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <div>No reports generated yet.</div>
            <div className="text-xs mt-1">Reports will appear here once the /oauth/reports endpoint is wired up.</div>
          </div>
        ) : (
          <ul className="divide-y divide-gdt-border">
            {reports.map((r) => (
              <li key={r._apikey ?? r.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gdt-slate">{r.title}</div>
                  <div className="text-xs text-gdt-slate-lt">{r.date} · {r.kind}</div>
                </div>
                <a
                  href={r.url}
                  download
                  className="inline-flex items-center gap-1 text-sm text-gdt-green hover:text-gdt-green-mid"
                >
                  <Download className="w-4 h-4" /> Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
