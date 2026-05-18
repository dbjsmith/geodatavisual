/**
 * App.jsx
 *
 * Receives the navigation_context from the BlueBox host via postMessage
 * (or mock context in dev mode) and routes to the appropriate level view.
 *
 *   level: 'org'      → OrgLevel
 *          'property' → PropertyLevel
 *          'area'     → AreaLevel
 *          'geopoint' → GeopointLevel
 *          'survey'   → SurveyLevel
 *          'reports'  → ReportsLevel
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
  const { ctx, isDev } = useHostContext()

  if (!ctx) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gdt-slate-lt">
        <div className="text-center">
          <div className="text-sm font-medium text-gdt-slate mb-1">Waiting for host context…</div>
          <div className="text-xs">
            Listening for <code className="font-mono text-gdt-green-mid">host:init</code> from BlueBox.
          </div>
        </div>
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
