import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EmptyState } from '../ui/empty-state'
import { Card, CardTitle } from '../ui/card'

export function LeadFunnelChart({
  stages,
  unqualified,
}: {
  stages: { key: string; label: string; count: number }[]
  unqualified: number
}) {
  if (stages.every((s) => s.count === 0) && unqualified === 0) {
    return (
      <Card>
        <CardTitle>Lead status distribution</CardTitle>
        <div className="mt-3">
          <EmptyState message="No leads in the selected period." />
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <CardTitle>Lead status distribution</CardTitle>
      <p className="mt-1 text-xs text-slate-500">
        Counts by current status for leads created in range (not a sequential cohort funnel).
      </p>
      <div className="mt-3 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stages} layout="vertical" margin={{ left: 16, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" name="Leads" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Unqualified: <span className="font-semibold text-slate-900">{unqualified}</span>
      </p>
    </Card>
  )
}
