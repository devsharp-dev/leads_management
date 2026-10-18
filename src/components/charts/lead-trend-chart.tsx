import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardTitle } from '../ui/card'
import { EmptyState } from '../ui/empty-state'

export function LeadTrendChart({
  data,
}: {
  data: { label: string; newLeads: number; qualified: number; converted: number }[]
}) {
  const empty = data.every((d) => d.newLeads === 0)
  return (
    <Card>
      <CardTitle>Daily lead trend</CardTitle>
      <p className="mt-1 text-xs text-slate-500">Based on lead created date.</p>
      <div className="mt-3 h-56">
        {empty ? (
          <EmptyState message="No lead activity in this range." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="newLeads" name="New leads" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="qualified" name="Qualified" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="converted" name="Converted" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}
