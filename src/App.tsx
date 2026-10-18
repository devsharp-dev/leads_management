import { useEffect, useState } from 'react'
import { loadAnalyticsDataset, type LoadResult } from './data/repository'
import { FilterProvider } from './features/filters/FilterContext'
import { DashboardPage } from './pages/DashboardPage'

export default function App() {
  const [result, setResult] = useState<LoadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const loaded = await loadAnalyticsDataset()
        if (!cancelled) {
          setResult(loaded)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load analytics data')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600" role="status">
        Loading analytics…
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-red-700" role="alert">
        {error ?? 'No data available'}
      </div>
    )
  }

  return (
    <FilterProvider>
      <DashboardPage data={result.data} source={result.source} warning={result.warning} />
    </FilterProvider>
  )
}
