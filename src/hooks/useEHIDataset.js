/**
 * useEHIDataset(ctx)
 *
 * Looks up a bundled dataset for the current property. Multi-criteria
 * match (apikey OR code OR name substring) so the same farm can be
 * resolved across multiple organisations without each org's apikey
 * being hard-coded.
 *
 * Returns:
 *   { dataset, latest, trend, surveys, hasData, matchInfo }
 *
 * `matchInfo` reports which criterion hit (or didn't), for the debug
 * ribbon. Display it as something like:
 *   "matched on name (bell farming)" or "no dataset matches"
 */

import { useMemo } from 'react'
import { getDatasetForProperty, explainMatch } from '../data/datasetRegistry'

export function useEHIDataset(ctx) {
  const property = ctx?.property ?? null
  const apikey   = property?._apikey ?? null
  const name     = property?.name    ?? null
  const code     = property?.code    ?? null

  return useMemo(() => {
    const dataset = getDatasetForProperty(property)
    const matchInfo = explainMatch(property)
    if (!dataset) {
      return { dataset: null, latest: null, trend: null, surveys: null, hasData: false, matchInfo }
    }
    return {
      dataset,
      latest:  dataset.latest_snapshot ?? null,
      trend:   dataset.trend           ?? [],
      surveys: dataset.surveys         ?? [],
      hasData: Boolean(dataset.surveys?.length),
      matchInfo,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apikey, name, code])
}
