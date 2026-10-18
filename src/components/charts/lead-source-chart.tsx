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
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="h-48">
          {data.length === 0 ? (
            <EmptyState message="No sources to show." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="count" nameKey="source" innerRadius={45} outerRadius={70}>
                  {data.map((_, i) => (
                    <Cell key={data[i]!.source} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <ul className="space-y-2 text-sm">
          {data.map((row, i) => (
            <li key={row.source} className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                  aria-hidden
                />
                {row.source}
              </span>
              <span className="tabular-nums text-slate-600">
                {row.count} ({formatPercent(row.percent)})
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
