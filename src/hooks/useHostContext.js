/**
 * useHostContext
 *
 * Receives the BlueBox host's host:init / host:navigate messages, normalises
 * them into the internal `ctx` shape that level views expect, and falls back
 * to Thornfield mock data in standalone dev mode.
 *
 * Internal ctx shape:
 *   {
 *     level:       'org' | 'property' | 'area' | 'geopoint' | 'survey' | 'reports',
 *     oauth_token: string,
 *     api_origin:  string,        // e.g. https://geodatatrack-dev.phpbucket.net
 *     api_base:    string,        // e.g. /api/v1
 *     org:         { _apikey, name },
 *     property?:   { _apikey, name },
 *     area?:       { _apikey, name },
 *     point?:      { _apikey, name },
 *     survey?:     { _apikey, name },
 *     _raw:        <full BlueBox payload for debugging / forward-compat>,
 *   }
 */

import { useEffect, useState } from 'react'
import { MSG, isHostMessage, emitReady } from '../lib/postMessage'
import { mockContext } from '../lib/mockData'

const IN_IFRAME = typeof window !== 'undefined' && window.parent !== window

/* ──────────────────────────────────────────────────────────────────────────
 * Transform BlueBox's payload shape → our internal ctx shape
 *
 * BlueBox payload shape (observed 2026-05-18 on geodatatrack-dev.phpbucket.net):
 *   {
 *     access_token:        "...",
 *     api_base:            "/api/v1",
 *     transport:           "Authorization: Bearer",
 *     navigation_context: {
 *       kind:              "property" | "area" | "geopoint" | "survey" | ...,
 *       org_apikey:        "...",
 *       org_name:          "...",
 *       property_apikey:   "...",
 *       property_name:     "...",
 *       area_apikey:       null,
 *       area_name:         null,
 *       point_apikey:      null,
 *       point_name:        null,
 *       survey_apikey:     null,
 *       survey_name:       null,
 *       path_items:        [...],
 *     },
 *     ...
 *   }
 * ────────────────────────────────────────────────────────────────────────── */
function transformBlueBoxPayload(payload, hostOrigin) {
  const nc = payload?.navigation_context ?? {}

  const entityOrNull = (apikey, name) =>
    apikey ? { _apikey: apikey, name: name ?? null } : null

  return {
    level:       nc.kind ?? 'property',
    oauth_token: payload?.access_token ?? null,
    api_origin:  hostOrigin ?? null,
    api_base:    payload?.api_base ?? '',
    org:         { _apikey: nc.org_apikey ?? null, name: nc.org_name ?? null },
    property:    entityOrNull(nc.property_apikey, nc.property_name),
    area:        entityOrNull(nc.area_apikey,     nc.area_name),
    point:       entityOrNull(nc.point_apikey,    nc.point_name),
    survey:      entityOrNull(nc.survey_apikey,   nc.survey_name),
    _raw:        payload,
  }
}

export function useHostContext() {
  const [ctx, setCtx]               = useState(null)
  const [messageLog, setMessageLog] = useState([])

  useEffect(() => {
    function processMessage(evt) {
      const entry = {
        origin: evt.origin,
        data:   evt.data,
        time:   Date.now(),
      }
      setMessageLog(log => [...log, entry])

      if (!isHostMessage(evt)) return

      // BlueBox shape (preferred): { type, payload: { access_token, navigation_context, ... } }
      if (evt.data.payload) {
        setCtx(transformBlueBoxPayload(evt.data.payload, evt.origin))
        return
      }

      // Original spec shape (legacy/dev): { type, navigation_context: {...} }
      const nc = evt.data.navigation_context ?? evt.data.context
      if (nc) setCtx(nc)
    }

    // ── Drain any messages that arrived before React mounted ─────────────
    const early = window.__gdvEarlyMessages ?? []
    for (const m of early) {
      processMessage({ origin: m.origin, data: m.data })
    }

    function onMessage(evt) { processMessage(evt) }
    window.addEventListener('message', onMessage)

    if (!IN_IFRAME) {
      setCtx(mockContext)
    }

    emitReady()

    return () => window.removeEventListener('message', onMessage)
  }, [])

  return {
    ctx,
    isDev:    !IN_IFRAME,
    inIframe: IN_IFRAME,
    messageLog,
  }
}

export { MSG }
