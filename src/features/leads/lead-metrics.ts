import { eachCalendarDay, isWithinRange, toDateKey } from '../../lib/dates/date-range'
import { compareRatePoints, compareValues, safeRate } from '../../lib/format/number'
import type {
  AnalyticsDataset,
  DateRange,
  GlobalFilters,
  Lead,
} from '../../types/domain'
import { categoryMap, filterLeads } from '../filters/filter-dataset'

export interface LeadKpis {
  total: number
  qualified: number
  converted: number
  unqualified: number
  conversionRate: number
  qualifiedRate: number
  unqualifiedRate: number
  comparisons: {
    total: ReturnType<typeof compareValues>
    qualified: ReturnType<typeof compareValues>
    converted: ReturnType<typeof compareValues>
    unqualified: ReturnType<typeof compareValues>
    conversionRate: ReturnType<typeof compareRatePoints>
  }
}

function countByStatus(leads: Lead[]) {
  const qualified = leads.filter((l) => l.status === 'qualified' || l.status === 'converted').length
  const converted = leads.filter((l) => l.status === 'converted').length
  const unqualified = leads.filter((l) => l.status === 'unqualified').length
  return {
    total: leads.length,
    qualified,
    converted,
    unqualified,
    conversionRate: safeRate(converted, leads.length),
    qualifiedRate: safeRate(qualified, leads.length),
    unqualifiedRate: safeRate(unqualified, leads.length),
  }
}

export function computeLeadKpis(
  data: AnalyticsDataset,
  range: DateRange,
  previous: Pick<DateRange, 'start' | 'end'>,
  filters: Pick<GlobalFilters, 'ownerId' | 'departmentId'>,
): LeadKpis {
  const current = countByStatus(filterLeads(data.leads, range, filters))
  const prev = countByStatus(filterLeads(data.leads, previous, filters))
  return {
    ...current,
    comparisons: {
      total: compareValues(current.total, prev.total),
      qualified: compareValues(current.qualified, prev.qualified),
      converted: compareValues(current.converted, prev.converted),
      unqualified: compareValues(current.unqualified, prev.unqualified),
      conversionRate: compareRatePoints(current.conversionRate, prev.conversionRate),
    },
  }
}

/** Status distribution for leads created in range (not a sequential cohort funnel). */
export function leadStatusDistribution(
  data: AnalyticsDataset,
  range: DateRange,
  filters: Pick<GlobalFilters, 'ownerId' | 'departmentId'>,
) {
  const leads = filterLeads(data.leads, range, filters)
  const newCount = leads.filter((l) => l.status === 'new' || l.status === 'contacted').length
  const qualified = leads.filter((l) => l.status === 'qualified').length
  const converted = leads.filter((l) => l.status === 'converted').length
  const unqualified = leads.filter((l) => l.status === 'unqualified').length
  return {
    stages: [
      { key: 'new', label: 'New / Contacted', count: newCount },
      { key: 'qualified', label: 'Qualified', count: qualified },
      { key: 'converted', label: 'Converted', count: converted },
    ],
    unqualified,
    total: leads.length,
  }
}

export function leadDailyTrend(
  data: AnalyticsDataset,
  range: DateRange,
  filters: Pick<GlobalFilters, 'ownerId' | 'departmentId'>,
) {
  const leads = filterLeads(data.leads, range, filters)
  return eachCalendarDay(range).map((day) => {
    const key = toDateKey(day)
    const dayLeads = leads.filter((l) => toDateKey(l.createdAt) === key)
    return {
      date: key,
      label: key.slice(5),
      newLeads: dayLeads.length,
      qualified: dayLeads.filter((l) => l.status === 'qualified' || l.status === 'converted').length,
      converted: dayLeads.filter((l) => l.status === 'converted').length,
    }
  })
}

export function leadSourceBreakdown(
  data: AnalyticsDataset,
  range: DateRange,
  filters: Pick<GlobalFilters, 'ownerId' | 'departmentId'>,
) {
  const leads = filterLeads(data.leads, range, filters)
  const map = new Map<string, number>()
  for (const lead of leads) {
    map.set(lead.source, (map.get(lead.source) ?? 0) + 1)
  }
  const total = leads.length || 1
  return [...map.entries()]
    .map(([source, count]) => ({
      source,
      count,
      percent: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count)
}

export function salesTeamActivity(
  data: AnalyticsDataset,
  range: DateRange,
  filters: Pick<GlobalFilters, 'ownerId' | 'departmentId' | 'serviceCategoryId'>,
) {
  const cats = categoryMap(data)
  const salesUsers = data.users.filter((u) => u.role === 'sales' || u.role === 'admin')
  return salesUsers
    .map((user) => {
      const ownerFilters = { ...filters, ownerId: user.id as string }
      const leads = filterLeads(data.leads, range, ownerFilters)
      const qualified = leads.filter((l) => l.status === 'qualified' || l.status === 'converted').length
      const converted = leads.filter((l) => l.status === 'converted').length
      const quotations = data.quotations.filter(
        (q) =>
          q.ownerId === user.id &&
          isWithinRange(q.createdAt, range) &&
          (filters.serviceCategoryId === 'all' ||
            q.serviceCategoryId === filters.serviceCategoryId),
      )
      const deals = data.deals.filter(
        (d) =>
          d.ownerId === user.id &&
          isWithinRange(d.createdAt, range) &&
          (filters.serviceCategoryId === 'all' ||
            d.serviceCategoryId === filters.serviceCategoryId) &&
          (filters.departmentId === 'all' ||
            cats.get(d.serviceCategoryId)?.departmentId === filters.departmentId),
      )
      const dealValue = deals.reduce((s, d) => s + d.value, 0)
      const orderIds = new Set(
        data.orders.filter((o) => deals.some((d) => d.id === o.dealId)).map((o) => o.id),
      )
      const revenue = data.payments
        .filter(
          (p) =>
            p.status === 'completed' &&
            orderIds.has(p.orderId) &&
            isWithinRange(p.paidAt, range),
        )
        .reduce((s, p) => s + p.amount, 0)
      return {
        userId: user.id,
        name: user.name,
        leadsHandled: leads.length,
        qualified,
        converted,
        conversionRate: safeRate(converted, leads.length),
        quotations: quotations.length,
        deals: deals.length,
        dealValue,
        revenue,
      }
    })
    .filter((row) => row.leadsHandled + row.quotations + row.deals > 0)
    .sort((a, b) => b.leadsHandled - a.leadsHandled)
}
