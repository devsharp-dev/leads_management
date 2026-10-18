import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatINR, formatINRCompact } from '../../lib/format/currency'
import { Card, CardTitle } from '../ui/card'
import { EmptyState } from '../ui/empty-state'

export function DealsVsRevenueChart({
  data,
}: {
  data: { name: string; count: number; value: number }[]
}) {
  return (
    <Card>
      <CardTitle>Deals created vs deal revenue</CardTitle>
      <div className="mt-3 h-64">
        {data.length === 0 ? (
          <EmptyState message="No deals in range." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis yAxisId="left" allowDecimals={false} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(v) => formatINRCompact(Number(v))}
              />
              <Tooltip
                formatter={(value, name) =>
                  name === 'Deal revenue'
                    ? formatINR(Number(value ?? 0))
                    : Number(value ?? 0)
                }
              />
              <Legend />
              <Bar yAxisId="left" dataKey="count" name="Deals created" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="value" name="Deal revenue" stroke="#1d4ed8" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

export function RevenueByServiceChart({
  data,
}: {
  data: { name: string; amount: number }[]
}) {
  return (
    <Card>
      <CardTitle>Revenue by order / service category</CardTitle>
      <p className="mt-1 text-xs text-slate-500">Completed payments in range, attributed via deal service.</p>
      <div className="mt-3 h-64">
        {data.length === 0 ? (
          <EmptyState message="No collected revenue in range." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tickFormatter={(v) => formatINRCompact(Number(v))} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatINR(Number(value ?? 0))} />
              <Bar dataKey="amount" name="Collected" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

export function DailyRevenueTrendChart({
  data,
}: {
  data: { label: string; revenue: number; collected: number }[]
}) {
  const empty = data.every((d) => d.revenue === 0 && d.collected === 0)
  return (
    <Card>
      <CardTitle>Daily revenue trend</CardTitle>
      <p className="mt-1 text-xs text-slate-500">
        Revenue = order totals created that day; Collected = successful payments by paid date.
      </p>
      <div className="mt-3 h-64">
        {empty ? (
          <EmptyState message="No revenue activity in range." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatINRCompact(Number(v))} />
              <Tooltip formatter={(value) => formatINR(Number(value ?? 0))} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#93c5fd" radius={[2, 2, 0, 0]} />
              <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

export function OrderProgressChart({
  data,
}: {
  data: {
    name: string
    pending: number
    in_progress: number
    completed: number
    on_hold: number
  }[]
}) {
  return (
    <Card>
      <CardTitle>Orders &amp; stage progress</CardTitle>
      <div className="mt-3 h-64">
        {data.length === 0 ? (
          <EmptyState message="No orders linked to deals in range." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" stackOffset="expand" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="pending" stackId="a" fill="#fbbf24" name="Pending" />
              <Bar dataKey="in_progress" stackId="a" fill="#3b82f6" name="In progress" />
              <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed" />
              <Bar dataKey="on_hold" stackId="a" fill="#94a3b8" name="On hold" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}
