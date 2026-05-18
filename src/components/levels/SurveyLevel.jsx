/**
 * SurveyLevel — single survey detail.
 *
 * Shows the survey's indicator breakdown (radar) and summary.
 */

import EHIGauge     from '../charts/EHIGauge'
import ProcessRadar from '../charts/ProcessRadar'
import { mockIndicators } from '../../lib/mockData'

export default function SurveyLevel({ ctx }) {
  const survey     = ctx?.survey ?? {}
  const indicators = survey.indicators ?? ctx?.indicators ?? mockIndicators

  return (
    <div className="flex flex-col gap-5 p-5">
      <header>
        <div className="text-[11px] uppercase tracking-wider text-gdt-slate-lt">Survey</div>
        <h1 className="text-xl font-semibold text-gdt-slate">
          {survey.date ?? 'Undated'} — {survey.surveyor ?? 'Unknown surveyor'}
        </h1>
        {survey.point_name && (
          <p className="text-sm text-gdt-slate-lt mt-1">at {survey.point_name}</p>
        )}
      </header>

      <section className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
        <EHIGauge score={survey.ehi} label="Survey EHI" />
        <ProcessRadar data={indicators} title="Indicator breakdown" />
      </section>

      {survey.notes && (
        <section className="card p-4">
          <h2 className="text-sm font-semibold text-gdt-slate mb-2">Notes</h2>
          <p className="text-sm text-gdt-slate whitespace-pre-wrap">{survey.notes}</p>
        </section>
      )}
    </div>
  )
}
