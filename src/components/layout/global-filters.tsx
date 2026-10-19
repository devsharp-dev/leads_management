import { Download, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { buildCustomRange } from '../../lib/dates/date-range'
import type { AnalyticsDataset } from '../../types/domain'
import { useFilters } from '../../features/filters/FilterContext'
import { Button } from '../ui/button'

export function GlobalFiltersBar({
  data,
  onExport,
}: {
  data: AnalyticsDataset
  onExport: () => void
}) {
  const {
    filters,
    setPreset,
    setCustomRange,
    setOwnerId,
    setDepartmentId,
    setServiceCategoryId,
    resetFilters,
  } = useFilters()
  const [customError, setCustomError] = useState<string | null>(null)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  const applyCustom = () => {
    try {
      const range = buildCustomRange(start, end)
      setCustomRange(range)
      setCustomError(null)
    } catch {
      setCustomError('End date must be on or after start date.')
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-2">
          {(
            [
              ['today', 'Today'],
              ['last_7', 'Last 7 Days'],
              ['last_30', 'Last 30 Days'],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              variant={filters.dateRange.preset === key ? 'primary' : 'secondary'}
              onClick={() => setPreset(key)}
              aria-pressed={filters.dateRange.preset === key}
              className="px-2.5 py-1.5"
            >
              {label}
            </Button>
          ))}
          <label className="text-xs text-slate-600">
            From
            <input
              type="date"
              className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-600">
            To
            <input
              type="date"
              className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
          <Button onClick={applyCustom} disabled={!start || !end} className="px-2.5 py-1.5">
            Apply
          </Button>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-slate-600">
            User
            <select
              className="mt-1 block min-w-[140px] rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={filters.ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
            >
              <option value="all">All Users</option>
              {data.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-600">
            Department
            <select
              className="mt-1 block min-w-[140px] rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={filters.departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="all">All Departments</option>
              {data.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-600">
            Service
            <select
              className="mt-1 block min-w-[140px] rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={filters.serviceCategoryId}
              onChange={(e) => setServiceCategoryId(e.target.value)}
            >
              <option value="all">All Services</option>
              {data.serviceCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <Button onClick={resetFilters} aria-label="Reset filters" className="px-2.5 py-1.5">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button variant="primary" onClick={onExport} className="px-2.5 py-1.5">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      {customError ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {customError}
        </p>
      ) : null}
      <p className="mt-2 text-xs text-slate-500">
        Selected range:{' '}
        <span className="font-medium text-slate-700">{filters.dateRange.label}</span>
        {' · '}Comparisons use the immediately preceding equivalent period.
      </p>
    </div>
  )
}
