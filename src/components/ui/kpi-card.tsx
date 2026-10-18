import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ComparisonDisplay } from '../../lib/format/number'
import { Card } from './card'

export function KpiCard({
  title,
  value,
  comparison,
  subStat,
  icon,
}: {
  title: string
  value: string
  comparison?: ComparisonDisplay
  subStat?: string
  icon?: ReactNode
}) {
  const tone =
    comparison?.direction === 'up'
      ? 'text-emerald-600'
      : comparison?.direction === 'down'
        ? 'text-red-600'
        : 'text-slate-500'

  const Icon =
    comparison?.direction === 'up'
      ? ArrowUpRight
      : comparison?.direction === 'down'
        ? ArrowDownRight
        : Minus

  return (
    <Card className="flex min-h-[108px] flex-col justify-between gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
        {icon ? <span className="text-slate-400">{icon}</span> : null}
      </div>
      <p className="text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {comparison ? (
          <span className={`inline-flex items-center gap-0.5 font-medium ${tone}`}>
            <Icon className="h-3.5 w-3.5" aria-hidden />
            <span>{comparison.label}</span>
            <span className="sr-only">versus previous period</span>
          </span>
        ) : null}
        {subStat ? <span className="text-slate-500">{subStat}</span> : null}
      </div>
    </Card>
  )
}
