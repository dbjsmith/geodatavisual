/**
 * parseSurveyName
 *
 * GDT encodes the survey timestamp into the survey name itself, in the
 * format `<Survey Type> - YYYYMMDDHHMM`, e.g.
 *
 *   "Short Term Monitoring with Forage Assessment. - 202402051635"
 *   "Property Set Up Survey - 202604101635"
 *
 * Returns { type, date, dateRaw, dateISO, ok } where `ok` is false if the
 * name didn't match the expected pattern (the survey is still kept, just
 * without a parsed timestamp — it won't be plotted on the timeline).
 */

const NAME_DATE_RE = /^(.+?)\s*-\s*(\d{12})\s*$/

export function parseSurveyName(name) {
  if (!name || typeof name !== 'string') {
    return { type: 'Unknown', date: null, dateRaw: null, dateISO: null, ok: false }
  }

  const match = name.match(NAME_DATE_RE)
  if (!match) {
    return { type: name.trim(), date: null, dateRaw: null, dateISO: null, ok: false }
  }

  const [, rawType, dateRaw] = match
  const year   = parseInt(dateRaw.slice(0, 4),  10)
  const month  = parseInt(dateRaw.slice(4, 6),  10) - 1
  const day    = parseInt(dateRaw.slice(6, 8),  10)
  const hour   = parseInt(dateRaw.slice(8, 10), 10)
  const minute = parseInt(dateRaw.slice(10, 12), 10)

  const date = new Date(year, month, day, hour, minute)
  if (Number.isNaN(date.getTime())) {
    return { type: rawType.trim(), date: null, dateRaw, dateISO: null, ok: false }
  }

  // Strip trailing punctuation from the type ("Short Term Monitoring." → "Short Term Monitoring")
  const type = rawType.trim().replace(/[.,;:]+$/, '')

  return {
    type,
    date,
    dateRaw,
    dateISO: `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`,
    ok: true,
  }
}
