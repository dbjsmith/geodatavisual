/**
 * App.jsx
 *
 * Receives the navigation_context from the BlueBox host via postMessage
 * (or mock context in dev mode) and routes to the appropriate level view.
 *
 * Waiting state includes a visible debug panel showing every postMessage
 * received — so embedding issues can be diagnosed without DevTools.
 */

import { useHostContext } from './hooks/useHostContext'

import OrgLevel      from './components/levels/OrgLevel'
import PropertyLevel from './components/levels/PropertyLevel'
import AreaLevel     from './components/levels/AreaLevel'
import GeopointLevel from './components/levels/GeopointLevel'
import SurveyLevel   from './components/levels/SurveyLevel'
import ReportsLevel  from './components/levels/ReportsLevel'

const LEVELS = {
  org:      OrgLevel,
  property: PropertyLevel,
  area:     AreaLevel,
  geopoint: GeopointLevel,
  survey:   SurveyLevel,
  reports:  ReportsLevel,
}

export default function App() {
  const { ctx, isDev, messageLog } = useHostContext()

  if (!ctx) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gdt-slate-lt p-5">
        <div className="text-center mb-6">
          <div className="text-sm font-medium text-gdt-slate mb-1">
            Waiting for host context…
          </div>
          <div className="text-xs">
            Listening for <code className="font-mono text-gdt-green-mid">host:init</code> from BlueBox.
          </div>
        </div>

        {/* Debug panel — visible diagnostic without DevTools ─────────── */}
        <details
          open
          className="w-full max-w-2xl text-left bg-gdt-card border border-gdt-border rounded-lg p-3 text-xs"
        >
          <summary className="cursor-pointer font-medium text-gdt-slate select-none">
            Debug — {messageLog.length} postMessage{messageLog.length === 1 ? '' : 's'} received
          </summary>

          <div className="mt-3 space-y-2">
            <div className="text-gdt-slate-lt">
              <span className="font-medium text-gdt-slate">URL:</span>{' '}
              <code className="font-mono break-all">
                {typeof window !== 'undefined' ? window.location.href : '—'}
              </code>
            </div>

            <div className="text-gdt-slate-lt">
              <span className="font-medium text-gdt-slate">Embedded:</span>{' '}
              {typeof window !== 'undefined' && window.parent !== window ? 'yes (in iframe)' : 'no (standalone)'}
            </div>

            <div>
              <div className="font-medium text-gdt-slate mb-1">Captured messages:</div>
              <pre className="overflow-auto max-h-96 bg-gdt-bg p-2 rounded text-[10px] font-mono whitespace-pre-wrap break-all">
                {messageLog.length === 0
                  ? '(none yet — if this stays empty, host is not sending postMessage)'
                  : JSON.stringify(messageLog, null, 2)}
              </pre>
            </div>
          </div>
        </details>
      </div>
    )
  }

  const Level = LEVELS[ctx.level] ?? PropertyLevel

  return (
    <div className="min-h-screen bg-gdt-bg">
      {isDev && (
        <div className="bg-gdt-amber/20 border-b border-gdt-amber/40 text-[11px] text-gdt-slate px-4 py-1.5">
          <span className="font-semibold">DEV MODE</span> · Using Thornfield mock data ·
          standalone (no BlueBox host) ·
          level: <code className="font-mono">{ctx.level}</code>
        </div>
      )}
      <Level ctx={ctx} />
    </div>
  )
}
