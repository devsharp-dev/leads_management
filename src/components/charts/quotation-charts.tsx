import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatINR, formatINRCompact } from '../../lib/format/currency'
import { formatPercent } from '../../lib/format/number'
import { Card, CardTitle } from '../ui/card'
import { EmptyState } from '../ui/empty-state'

export function QuotationsByServiceChart({
  data,
}: {
  data: { name: string; count: number }[]
}) {
  return (
    <Card>
      <CardTitle>Quotations by service / order category</CardTitle>
      <div className="mt-3 h-64">
        {data.length === 0 ? (
          <EmptyState message="No quotations in range." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Quotations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

export function QuotationValueChart({
  data,
}: {
  data: { name: string; amount: number; percent: number }[]
}) {
  return (
    <Card>
      <CardTitle>Quotation value by service</CardTitle>
      <p className="mt-1 text-xs text-slate-500">Sum of quotation amounts created in range.</p>
      <div className="mt-3 h-64">
        {data.length === 0 ? (
          <EmptyState message="No quotation value in range." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tickFormatter={(v) => formatINRCompact(Number(v))} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatINR(Number(value ?? 0))} />
              <Bar dataKey="amount" name="Quoted amount" fill="#60a5fa" radius={[0, 4, 4, 0]}>
                {data.map((row) => (
                  <Cell key={row.name} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <ul className="mt-2 space-y-1 text-xs text-slate-600">
        {data.slice(0, 4).map((row) => (
          <li key={row.name}>
            {row.name}: {formatINR(row.amount)} ({formatPercent(row.percent)})
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function QuoteToDealGauge({
  rate,
  deals,
  quotations,
}: {
  rate: number
  deals: number
  quotations: number
}) {
  const chartData = [{ name: 'rate', value: Math.min(rate, 100), fill: '#3b82f6' }]
  return (
    <Card className="flex flex-col">
      <CardTitle>Quote to deal conversion rate</CardTitle>
      <p className="mt-1 text-xs text-slate-500">
        Distinct quotations linked to a deal / quotations created in range.
      </p>
      <div className="mx-auto mt-2 h-48 w-48">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={chartData}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar background dataKey="value" cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center text-3xl font-semibold tabular-nums text-slate-900">
        {formatPercent(rate)}
      </p>
      <p className="mt-1 text-center text-sm text-slate-500">
        {deals} converted quotes / {quotations} quotations
      </p>
    </Card>
  )
}
