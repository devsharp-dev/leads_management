import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardTitle } from '../ui/card'
import { EmptyState } from '../ui/empty-state'
import { formatPercent } from '../../lib/format/number'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#64748b', '#ef4444']

export function LeadSourceChart({
  data,
}: {
  data: { source: string; count: number; percent: number }[]
}) {
  return (
    <Card>
      <CardTitle>Lead sources</CardTitle>
      <div className="mt-2">
        <div className="mx-auto h-36 w-full max-w-[200px]">
          {data.length === 0 ? (
            <EmptyState message="No sources to show." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="count" nameKey="source" innerRadius={36} outerRadius={56}>
                  {data.map((_, i) => (
                    <Cell key={data[i]!.source} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <ul className="mt-2 space-y-1 text-xs">
          {data.map((row, i) => (
            <li key={row.source} className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 truncate">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                  aria-hidden
                />
                {row.source}
              </span>
              <span className="shrink-0 tabular-nums text-slate-600">
                {row.count} ({formatPercent(row.percent)})
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
