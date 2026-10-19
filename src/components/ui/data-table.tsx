import { useMemo, useState, type ReactNode } from 'react'
import { Button } from './button'

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  render: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  searchKeys,
  searchPlaceholder = 'Search…',
  onRowClick,
  emptyMessage = 'No rows to display.',
  statusOptions,
  statusValue,
  pageSize = 8,
}: {
  columns: Column<T>[]
  rows: T[]
  searchKeys?: (row: T) => string
  searchPlaceholder?: string
  onRowClick?: (row: T) => void
  emptyMessage?: string
  statusOptions?: { value: string; label: string }[]
  statusValue?: (row: T) => string
  pageSize?: number
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = rows
    if (q && searchKeys) {
      list = list.filter((row) => searchKeys(row).toLowerCase().includes(q))
    }
    if (status !== 'all' && statusValue) {
      list = list.filter((row) => statusValue(row) === status)
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey)
      if (col?.sortValue) {
        list = [...list].sort((a, b) => {
          const av = col.sortValue!(a)
          const bv = col.sortValue!(b)
          if (av < bv) return sortDir === 'asc' ? -1 : 1
          if (av > bv) return sortDir === 'asc' ? 1 : -1
          return 0
        })
      }
    }
    return list
  }, [rows, query, searchKeys, sortKey, sortDir, columns, status, statusValue])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize)

  const toggleSort = (key: string) => {
    setPage(0)
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-end gap-2">
        {searchKeys ? (
          <label className="text-xs text-slate-600">
            <span className="sr-only">{searchPlaceholder}</span>
            <input
              type="search"
              className="w-full min-w-[180px] max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(0)
              }}
            />
          </label>
        ) : null}
        {statusOptions && statusValue ? (
          <label className="text-xs text-slate-600">
            Status
            <select
              className="mt-1 block rounded-lg border border-slate-200 px-2 py-2 text-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(0)
              }}
            >
              <option value="all">All statuses</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col" className="whitespace-nowrap px-3 py-2 font-medium">
                  {col.sortable ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-slate-800"
                      onClick={() => toggleSort(col.key)}
                    >
                      {col.header}
                      {sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : null}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {pageRows.map((row) => (
              <tr
                key={row.id}
                className={onRowClick ? 'cursor-pointer hover:bg-slate-50' : undefined}
                onClick={() => onRowClick?.(row)}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onRowClick(row)
                  }
                }}
                tabIndex={onRowClick ? 0 : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className="whitespace-nowrap px-3 py-2 text-slate-700">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {filtered.length > pageSize ? (
        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-600">
          <span>
            Showing {safePage * pageSize + 1}–
            {Math.min((safePage + 1) * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-1">
            <Button
              variant="secondary"
              className="px-2 py-1 text-xs"
              disabled={safePage <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              className="px-2 py-1 text-xs"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
