import { eachCalendarDay, isWithinRange, toDateKey } from '../../lib/dates/date-range'
import { compareValues } from '../../lib/format/number'
import type {
  AnalyticsDataset,
  DateRange,
  GlobalFilters,
  Payment,
} from '../../types/domain'
import { categoryMap, filterDeals } from '../filters/filter-dataset'

function completedPayments(payments: Payment[]) {
  return payments.filter((p) => p.status === 'completed')
}

export function orderBalance(
  orderTotal: number,
  payments: Payment[],
): number {
  const collected = completedPayments(payments).reduce((s, p) => s + p.amount, 0)
  const refunded = payments
    .filter((p) => p.status === 'refunded')
    .reduce((s, p) => s + p.amount, 0)
  return Math.max(orderTotal - collected + refunded, 0)
}

export function computeDealRevenueKpis(
  data: AnalyticsDataset,
  range: DateRange,
  previous: Pick<DateRange, 'start' | 'end'>,
  filters: Pick<GlobalFilters, 'ownerId' | 'departmentId' | 'serviceCategoryId'>,
) {
  const cats = categoryMap(data)
  const deals = filterDeals(data.deals, range, filters, cats)
  const prevDeals = filterDeals(data.deals, previous, filters, cats)
  const totalDealValue = deals.reduce((s, d) => s + d.value, 0)
  const prevDealValue = prevDeals.reduce((s, d) => s + d.value, 0)

  const collected = completedPayments(data.payments)
    .filter((p) => isWithinRange(p.paidAt, range))
    .reduce((s, p) => s + p.amount, 0)
  const prevCollected = completedPayments(data.payments)
    .filter((p) => isWithinRange(p.paidAt, previous))
    .reduce((s, p) => s + p.amount, 0)

  // Outstanding: balances for orders belonging to deals created in range
  const dealIds = new Set(deals.map((d) => d.id))
  const cohortOrders = data.orders.filter((o) => dealIds.has(o.dealId))
  const outstanding = cohortOrders.reduce((sum, order) => {
    const pays = data.payments.filter((p) => p.orderId === order.id)
    return sum + orderBalance(order.totalAmount, pays)
  }, 0)

  return {
    dealsCreated: deals.length,
    totalDealValue,
    collectedRevenue: collected,
    outstandingRevenue: outstanding,
    comparisons: {
      dealsCreated: compareValues(deals.length, prevDeals.length),
      totalDealValue: compareValues(totalDealValue, prevDealValue),
      collectedRevenue: compareValues(collected, prevCollected),
    },
  }
}

export function dealsByService(
  data: AnalyticsDataset,
  range: DateRange,
  filters: Pick<GlobalFilters, 'ownerId' | 'departmentId' | 'serviceCategoryId'>,
) {
  const cats = categoryMap(data)
  const deals = filterDeals(data.deals, range, filters, cats)
  const map = new Map<string, { count: number; value: number }>()
  for (const d of deals) {
    const cur = map.get(d.serviceCategoryId) ?? { count: 0, value: 0 }
    cur.count += 1
    cur.value += d.value
    map.set(d.serviceCategoryId, cur)
  }
  return [...map.entries()]
    .map(([categoryId, v]) => ({
      categoryId,
      name: cats.get(categoryId)?.name ?? categoryId,
      ...v,
    }))
    .sort((a, b) => b.value - a.value)
}

export function priorityBreakdown(
  data: AnalyticsDataset,
  range: DateRange,
  filters: Pick<GlobalFilters, 'ownerId' | 'departmentId' | 'serviceCategoryId'>,
) {
  const cats = categoryMap(data)
  const deals = filterDeals(data.deals, range, filters, cats)
  const totalValue = deals.reduce((s, d) => s + d.value, 0) || 1
  return (['high', 'medium', 'low'] as const).map((priority) => {
    const subset = deals.filter((d) => d.priority === priority)
    const value = subset.reduce((s, d) => s + d.value, 0)
    return {
      priority,
      count: subset.length,
      value,
      valueShare: (value / totalValue) * 100,
    }
  })
}

export function dailyRevenueTrend(
  data: AnalyticsDataset,
  range: DateRange,
  filters: Pick<GlobalFilters, 'ownerId' | 'departmentId' | 'serviceCategoryId'>,
) {
  const cats = categoryMap(data)
  const deals = filterDeals(data.deals, range, filters, cats)
  const dealIds = new Set(deals.map((d) => d.id))
  const orderIds = new Set(
    data.orders.filter((o) => dealIds.has(o.dealId)).map((o) => o.id),
  )

  return eachCalendarDay(range).map((day) => {
    const key = toDateKey(day)
    const invoiced = data.orders
      .filter((o) => dealIds.has(o.dealId) && toDateKey(o.createdAt) === key)
      .reduce((s, o) => s + o.totalAmount, 0)
    const collected = completedPayments(data.payments)
      .filter((p) => orderIds.has(p.orderId) && p.paidAt && toDateKey(p.paidAt) === key)
      .reduce((s, p) => s + p.amount, 0)
    return {
      date: key,
      label: key.slice(5),
      revenue: invoiced,
      collected,
    }
  })
}

export function revenueByService(
  data: AnalyticsDataset,
  range: DateRange,
  filters: Pick<GlobalFilters, 'ownerId' | 'departmentId' | 'serviceCategoryId'>,
) {
  const cats = categoryMap(data)
  const deals = filterDeals(data.deals, range, filters, cats)
  const map = new Map<string, number>()
  for (const deal of deals) {
    const orderIds = data.orders.filter((o) => o.dealId === deal.id).map((o) => o.id)
    const collected = completedPayments(data.payments)
      .filter(
        (p) =>
          orderIds.includes(p.orderId) && isWithinRange(p.paidAt, range),
      )
      .reduce((s, p) => s + p.amount, 0)
    map.set(deal.serviceCategoryId, (map.get(deal.serviceCategoryId) ?? 0) + collected)
  }
  return [...map.entries()]
    .map(([categoryId, amount]) => ({
      categoryId,
      name: cats.get(categoryId)?.name ?? categoryId,
      amount,
    }))
    .filter((r) => r.amount > 0)
    .sort((a, b) => b.amount - a.amount)
}
