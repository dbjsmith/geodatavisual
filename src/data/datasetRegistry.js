/**
 * datasetRegistry
 *
 * Maps a GDT property apikey to a bundled JSON dataset. Datasets contain
 * pre-computed EHI scores, indicator-level data, and year-aggregated
 * property/process indices — sourced from source-of-truth import
 * spreadsheets (e.g. BELImport.xlsx) that get imported into GeoDataTrack.
 *
 * Returns null when no dataset is registered for the given apikey, in
 * which case the app falls back to API-driven or mock data.
 *
 * Adding a new property:
 *   1. Convert its import spreadsheet to JSON (see /tools/import-to-json)
 *   2. Drop the file into ./datasets/
 *   3. Add an entry to REGISTRY below, keyed by GDT property apikey
 */

import belDataset from './datasets/bel.json'

const REGISTRY = {
  // BEL — WL Bell Farming Pty Ltd & Highland Farm Trust
  '97864814fa7b7f5fe26c02808bbcdd33': belDataset,
}

export function getDatasetForProperty(apikey) {
  if (!apikey) return null
  return REGISTRY[apikey] ?? null
}

export function hasDatasetFor(apikey) {
  return Boolean(apikey && REGISTRY[apikey])
}

export function listRegisteredApikeys() {
  return Object.keys(REGISTRY)
}
