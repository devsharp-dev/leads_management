import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { buildPresetRange } from '../../lib/dates/date-range'
import type { DateRange, DrillEntity, GlobalFilters, ID } from '../../types/domain'
import { SEED_ANCHOR } from '../../data/seed/dataset'

interface FilterContextValue {
  filters: GlobalFilters
  setPreset: (preset: 'today' | 'last_7' | 'last_30') => void
  setCustomRange: (range: DateRange) => void
  setOwnerId: (id: ID | 'all') => void
  setDepartmentId: (id: ID | 'all') => void
  setServiceCategoryId: (id: ID | 'all') => void
  resetFilters: () => void
  drill: DrillEntity
  setDrill: (entity: DrillEntity) => void
  /** When true, date math uses seed anchor so demos match Oct 2026 fixtures. */
  useSeedClock: boolean
}

const FilterContext = createContext<FilterContextValue | null>(null)

function defaultFilters(): GlobalFilters {
  // Prefer Last 30 Days around the seed anchor so KPIs are meaningful out of the box.
  const now = SEED_ANCHOR
  return {
    dateRange: buildPresetRange('last_30', now),
    ownerId: 'all',
    departmentId: 'all',
    serviceCategoryId: 'all',
  }
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<GlobalFilters>(defaultFilters)
  const [drill, setDrill] = useState<DrillEntity>(null)

  const value = useMemo<FilterContextValue>(
    () => ({
      filters,
      setPreset: (preset) =>
        setFilters((f) => ({
          ...f,
          dateRange: buildPresetRange(preset, SEED_ANCHOR),
        })),
      setCustomRange: (range) => setFilters((f) => ({ ...f, dateRange: range })),
      setOwnerId: (ownerId) => setFilters((f) => ({ ...f, ownerId })),
      setDepartmentId: (departmentId) => setFilters((f) => ({ ...f, departmentId })),
      setServiceCategoryId: (serviceCategoryId) =>
        setFilters((f) => ({ ...f, serviceCategoryId })),
      resetFilters: () => {
        setFilters(defaultFilters())
        setDrill(null)
      },
      drill,
      setDrill,
      useSeedClock: true,
    }),
    [filters, drill],
  )

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilters must be used within FilterProvider')
  return ctx
}
