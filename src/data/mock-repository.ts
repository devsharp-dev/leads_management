import { seedDataset } from './seed/dataset'
import type { AnalyticsDataset } from '../types/domain'
import { validateDataset } from '../lib/validation/seed-validation'

/**
 * In-memory repository used when Supabase env vars are missing.
 * Isolated clearly from the live client path in `repository.ts`.
 */
export async function loadMockDataset(): Promise<{
  data: AnalyticsDataset
  source: 'mock'
}> {
  const issues = validateDataset(seedDataset).filter((i) => i.level === 'error')
  if (issues.length > 0) {
    console.warn('[mock-repository] seed validation errors', issues)
  }
  // Deep-ish clone so UI never mutates the singleton seed
  const data: AnalyticsDataset = structuredClone(seedDataset)
  return { data, source: 'mock' }
}
