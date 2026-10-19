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
        <CardTitle>Lead funnel</CardTitle>
        <div className="mt-3">
          <EmptyState message="No leads in the selected period." />
        </div>
      </Card>
    )
  }

  const max = Math.max(...stages.map((s) => s.count), 1)

  return (
    <Card>
      <CardTitle>Lead funnel</CardTitle>
      <p className="mt-1 text-xs text-slate-500">
        Status counts for leads created in range (distribution, not a sequential cohort).
      </p>
      <div className="mt-4 space-y-2">
        {stages.map((stage, index) => {
          const widthPct = 55 + (stage.count / max) * 45
          return (
            <div key={stage.key} className="flex flex-col items-center gap-1">
              <div
                className="flex h-10 items-center justify-between rounded-md bg-blue-500 px-3 text-sm font-medium text-white shadow-sm"
                style={{ width: `${widthPct}%` }}
                title={`${stage.label}: ${stage.count}`}
              >
                <span>{stage.label}</span>
                <span className="tabular-nums">{stage.count}</span>
              </div>
              {index < stages.length - 1 ? (
                <div className="h-2 w-px bg-slate-300" aria-hidden />
              ) : null}
            </div>
          )
        })}
      </div>
      <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        Unqualified:{' '}
        <span className="font-semibold tabular-nums text-slate-900">{unqualified}</span>
      </p>
    </Card>
  )
}
