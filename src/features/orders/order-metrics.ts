import { isWithinRange } from '../../lib/dates/date-range'
import { compareValues } from '../../lib/format/number'
import type {
  AnalyticsDataset,
  DateRange,
  GlobalFilters,
  OrderStatus,
} from '../../types/domain'
import { categoryMap, filterDeals } from '../filters/filter-dataset'
import { orderBalance } from '../deals/deal-metrics'

export function orderStatusBreakdown(
  data: AnalyticsDataset,
  range: DateRange,
  filters: Pick<GlobalFilters, 'ownerId' | 'departmentId' | 'serviceCategoryId'>,
) {
  const cats = categoryMap(data)
  const deals = filterDeals(data.deals, range, filters, cats)
  const dealIds = new Set(deals.map((d) => d.id))
  const inRange = data.orders.filter((o) => {
    if (!isWithinRange(o.createdAt, range)) return false
    const deal = data.deals.find((d) => d.id === o.dealId)
    if (!deal) return false
    if (
      filters.serviceCategoryId !== 'all' &&
      deal.serviceCategoryId !== filters.serviceCategoryId
    ) {
      return false
    }
    if (filters.departmentId !== 'all') {
      const dept = cats.get(deal.serviceCategoryId)?.departmentId
      if (dept && dept !== filters.departmentId) return false
    }
    return dealIds.has(o.dealId)
  })

  const statuses: OrderStatus[] = [
    'pending',
    'in_progress',
    'completed',
    'on_hold',
    'cancelled',
  ]
  return statuses.map((status) => {
    const subset = inRange.filter((o) => o.status === status)
    return {
      status,
      count: subset.length,
      value: subset.reduce((s, o) => s + o.totalAmount, 0),
    }
  })
}

export function ordersByServiceProgress(
  data: AnalyticsDataset,
  range: DateRange,
  filters: Pick<GlobalFilters, 'ownerId' | 'departmentId' | 'serviceCategoryId'>,
) {
  const cats = categoryMap(data)
  const deals = filterDeals(data.deals, range, filters, cats)
  const dealById = new Map(deals.map((d) => [d.id, d]))
  const orders = data.orders.filter((o) => dealById.has(o.dealId))
  const byCat = new Map<
    string,
    Record<'pending' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled', number>
  >()

  for (const order of orders) {
    const deal = dealById.get(order.dealId)!
    const key = deal.serviceCategoryId
    const row = byCat.get(key) ?? {
      pending: 0,
      in_progress: 0,
      completed: 0,
      on_hold: 0,
      cancelled: 0,
    }
    row[order.status] += 1
    byCat.set(key, row)
  }

  return [...byCat.entries()].map(([categoryId, counts]) => ({
    categoryId,
    name: cats.get(categoryId)?.name ?? categoryId,
    ...counts,
  }))
}

export function completedOrdersKpi(
  data: AnalyticsDataset,
  range: DateRange,
  previous: Pick<DateRange, 'start' | 'end'>,
) {
  const current = data.orders.filter(
    (o) => o.status === 'completed' && isWithinRange(o.completedAt, range),
  ).length
  const prev = data.orders.filter(
    (o) => o.status === 'completed' && isWithinRange(o.completedAt, previous),
  ).length
  return {
    completed: current,
    comparison: compareValues(current, prev),
  }
}

export function operationsTeamActivity(
  data: AnalyticsDataset,
  range: DateRange,
) {
  const ops = data.users.filter((u) => u.role === 'operations')
  const now = range.end
  return ops
    .map((user) => {
      const orders = data.orders.filter(
        (o) => o.ownerId === user.id && isWithinRange(o.createdAt, range),
      )
      const stagesCompleted = orders.filter((o) => o.status === 'completed').length
      const pendingStages = orders.filter(
        (o) => o.status === 'pending' || o.status === 'in_progress',
      ).length
      const overdue = orders.filter(
        (o) =>
          o.dueAt &&
          new Date(o.dueAt) < now &&
          o.status !== 'completed' &&
          o.status !== 'cancelled',
      ).length
      return {
        userId: user.id,
        name: user.name,
        ordersUpdated: orders.length,
        stagesCompleted,
        pendingStages,
        overdueOrders: overdue,
      }
    })
    .filter((r) => r.ordersUpdated > 0)
}

export function paymentHistoryRows(
  data: AnalyticsDataset,
  range: DateRange,
  filters: Pick<GlobalFilters, 'ownerId' | 'departmentId' | 'serviceCategoryId'>,
) {
  const cats = categoryMap(data)
  const deals = filterDeals(data.deals, range, filters, cats)
  const dealIds = new Set(deals.map((d) => d.id))
  const orderById = new Map(data.orders.map((o) => [o.id, o]))

  return data.payments
    .filter((p) => {
      const order = orderById.get(p.orderId)
      if (!order) return false
      if (!dealIds.has(order.dealId) && !isWithinRange(p.paidAt ?? p.createdAt, range)) {
        return false
      }
      return isWithinRange(p.paidAt ?? p.createdAt, range) || dealIds.has(order.dealId)
    })
    .map((p) => {
      const order = orderById.get(p.orderId)!
      const deal = data.deals.find((d) => d.id === order.dealId)
      return {
        ...p,
        orderReference: order.reference,
        dealReference: deal?.reference ?? '—',
        balance: orderBalance(
          order.totalAmount,
          data.payments.filter((x) => x.orderId === order.id),
        ),
      }
    })
    .sort(
      (a, b) =>
        new Date(b.paidAt ?? b.createdAt).getTime() -
        new Date(a.paidAt ?? a.createdAt).getTime(),
    )
}
