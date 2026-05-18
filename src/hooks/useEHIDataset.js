/**
 * useEHIDataset(ctx)
 *
 * Looks up a bundled dataset for the current property and returns
 * convenient views on it: latest snapshot, trend, per-survey indicator
 * data. Returns nulls when no dataset is registered, so callers can
 * fall back to API/mock paths.
 *
 *   { dataset, latest, trend, surveys, hasData }
 *
 * Hook (not just plain function) so React re-renders when ctx changes.
 */

import { useMemo } from 'react'
import { getDatasetForProperty } from '../data/datasetRegistry'

export function useEHIDataset(ctx) {
  const apikey = ctx?.property?._apikey ?? null

  return useMemo(() => {
    const dataset = getDatasetForProperty(apikey)
    if (!dataset) {
      return { dataset: null, latest: null, trend: null, surveys: null, hasData: false }
    }
    return {
      dataset,
      latest:  dataset.latest_snapshot ?? null,
      trend:   dataset.trend           ?? [],
      surveys: dataset.surveys         ?? [],
      hasData: Boolean(dataset.surveys?.length),
    }
  }, [apikey])
}
