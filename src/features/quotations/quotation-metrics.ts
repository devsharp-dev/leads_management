import { compareValues, safeRate } from '../../lib/format/number'
import type {
  AnalyticsDataset,
  DateRange,
  GlobalFilters,
} from '../../types/domain'
import { categoryMap, filterQuotations } from '../filters/filter-dataset'

export function computeQuotationKpis(
  data: AnalyticsDataset,
  range: DateRange,
  previous: Pick<DateRange, 'start' | 'end'>,
  filters: Pick<GlobalFilters, 'ownerId' | 'departmentId' | 'serviceCategoryId'>,
) {
  const cats = categoryMap(data)
  const current = filterQuotations(data.quotations, range, filters, cats)
  const prev = filterQuotations(data.quotations, previous, filters, cats)
  const converted = current.filter((q) => Boolean(q.dealId)).length
  const prevConverted = prev.filter((q) => Boolean(q.dealId)).length
  return {
    created: current.length,
    value: current.reduce((s, q) => s + q.amount, 0),
    quoteToDealRate: safeRate(converted, current.length),
    convertedCount: converted,
    comparisons: {
      created: compareValues(current.length, prev.length),
      value: compareValues(
        current.reduce((s, q) => s + q.amount, 0),
        prev.reduce((s, q) => s + q.amount, 0),
      ),
      quoteToDealRate: compareValues(
        safeRate(converted, current.length),
        safeRate(prevConverted, prev.length),
      ),
    },
  }
}

export function quotationsByService(
  data: AnalyticsDataset,
  range: DateRange,
  filters: Pick<GlobalFilters, 'ownerId' | 'departmentId' | 'serviceCategoryId'>,
) {
  const cats = categoryMap(data)
  const quotes = filterQuotations(data.quotations, range, filters, cats)
  const byCat = new Map<string, typeof quotes>()
  for (const q of quotes) {
    const list = byCat.get(q.serviceCategoryId) ?? []
    list.push(q)
    byCat.set(q.serviceCategoryId, list)
  }
  return [...byCat.entries()]
    .map(([categoryId, list]) => {
      const accepted = list.filter((q) => q.status === 'accepted').length
      const pending = list.filter((q) => q.status === 'pending' || q.status === 'sent').length
      const rejected = list.filter((q) => q.status === 'rejected').length
      const converted = list.filter((q) => Boolean(q.dealId)).length
      const amount = list.reduce((s, q) => s + q.amount, 0)
      return {
        categoryId,
        name: cats.get(categoryId)?.name ?? categoryId,
        count: list.length,
        amount,
        accepted,
        pending,
        rejected,
        conversionRate: safeRate(converted, list.length),
      }
    })
    .sort((a, b) => b.count - a.count)
}

export function quotationValueShare(
  data: AnalyticsDataset,
  range: DateRange,
  filters: Pick<GlobalFilters, 'ownerId' | 'departmentId' | 'serviceCategoryId'>,
) {
  const rows = quotationsByService(data, range, filters)
  const total = rows.reduce((s, r) => s + r.amount, 0) || 1
  return rows.map((r) => ({
    ...r,
    percent: (r.amount / total) * 100,
  }))
}
