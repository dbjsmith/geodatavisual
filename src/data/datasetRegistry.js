/**
 * datasetRegistry
 *
 * Looks up a bundled EHI dataset for a GDT property. The same physical
 * farm can appear in multiple organisations (e.g. BEL in both Grow-Wildr
 * and TruQuest), each with its own property_apikey but identical name
 * and code. So matching is multi-criteria — first apikey hit wins, then
 * code, then a substring name match.
 *
 * Adding a new property:
 *   1. Convert its import sheet to JSON, drop into ./datasets/
 *   2. Add an entry to DATASETS below with whatever match criteria you
 *      know — at minimum the code or name; apikeys can be added later
 *      from the debug ribbon if you want a faster exact match.
 */

import belDataset from './datasets/bel.json'

const DATASETS = [
  {
    dataset: belDataset,
    match: {
      // Known property apikeys across organisations. Grow-Wildr first.
      // TruQuest's apikey can be added here once read from the debug ribbon.
      apikeys: [
        '97864814fa7b7f5fe26c02808bbcdd33',  // Grow-Wildr
      ],
      // Stable identifiers used as fallbacks
      codes: ['BEL'],
      nameContains: [
        'bell farming',
        'wl bell',
        'highland farm trust',
      ],
    },
  },
]

function matches(property, criteria) {
  if (!property) return false
  if (property._apikey && criteria.apikeys?.includes(property._apikey)) return true
  if (property.code    && criteria.codes?.includes(property.code))      return true
  const name = (property.name ?? '').toLowerCase()
  if (name && criteria.nameContains?.some(s => name.includes(s.toLowerCase()))) return true
  return false
}

export function getDatasetForProperty(property) {
  if (!property) return null
  for (const entry of DATASETS) {
    if (matches(property, entry.match)) return entry.dataset
  }
  return null
}

export function hasDatasetFor(property) {
  return Boolean(getDatasetForProperty(property))
}

/**
 * Diagnostic helper: returns the *match reason* for the current property,
 * useful in the debug ribbon to confirm WHICH criterion struck.
 */
export function explainMatch(property) {
  if (!property) return { matched: false, reason: 'no property' }
  for (const entry of DATASETS) {
    const c = entry.match
    if (property._apikey && c.apikeys?.includes(property._apikey))   return { matched: true, by: 'apikey', value: property._apikey, dataset: entry.dataset.property?.code }
    if (property.code    && c.codes?.includes(property.code))         return { matched: true, by: 'code',   value: property.code,    dataset: entry.dataset.property?.code }
    const name = (property.name ?? '').toLowerCase()
    const hit  = c.nameContains?.find(s => name.includes(s.toLowerCase()))
    if (hit) return { matched: true, by: 'name', value: hit, dataset: entry.dataset.property?.code }
  }
  return { matched: false, reason: 'no dataset matches this property', property: { apikey: property._apikey, code: property.code, name: property.name } }
}
