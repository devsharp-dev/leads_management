import { isWithinRange } from '../../lib/dates/date-range'
import type {
  AnalyticsDataset,
  DateRange,
  Deal,
  GlobalFilters,
  Lead,
  Order,
  Payment,
  Quotation,
} from '../../types/domain'

export function matchesOwnerAndDept<
  T extends { ownerId: string; departmentId?: string; serviceCategoryId?: string },
>(row: T, filters: Pick<GlobalFilters, 'ownerId' | 'departmentId' | 'serviceCategoryId'>): boolean {
  if (filters.ownerId !== 'all' && row.ownerId !== filters.ownerId) return false
  if (
    filters.departmentId !== 'all' &&
    row.departmentId &&
    row.departmentId !== filters.departmentId
  ) {
    return false
  }
  if (
    filters.serviceCategoryId !== 'all' &&
    'serviceCategoryId' in row &&
    row.serviceCategoryId &&
    row.serviceCategoryId !== filters.serviceCategoryId
  ) {
    return false
  }
  return true
}

export function filterLeads(
  leads: Lead[],
  range: Pick<DateRange, 'start' | 'end'>,
  filters: Pick<GlobalFilters, 'ownerId' | 'departmentId'>,
): Lead[] {
  return leads.filter(
    (l) =>
      isWithinRange(l.createdAt, range) &&
      matchesOwnerAndDept(l, { ...filters, serviceCategoryId: 'all' }),
  )
}

export function filterQuotations(
  quotations: Quotation[],
  range: Pick<DateRange, 'start' | 'end'>,
  filters: Pick<GlobalFilters, 'ownerId' | 'departmentId' | 'serviceCategoryId'>,
  categoriesById: Map<string, { departmentId?: string }>,
): Quotation[] {
  return quotations.filter((q) => {
    if (!isWithinRange(q.createdAt, range)) return false
    if (filters.ownerId !== 'all' && q.ownerId !== filters.ownerId) return false
    if (
      filters.serviceCategoryId !== 'all' &&
      q.serviceCategoryId !== filters.serviceCategoryId
    ) {
      return false
    }
    if (filters.departmentId !== 'all') {
      const dept = categoriesById.get(q.serviceCategoryId)?.departmentId
      if (dept && dept !== filters.departmentId) return false
    }
    return true
  })
}

export function filterDeals(
  deals: Deal[],
  range: Pick<DateRange, 'start' | 'end'>,
  filters: Pick<GlobalFilters, 'ownerId' | 'departmentId' | 'serviceCategoryId'>,
  categoriesById: Map<string, { departmentId?: string }>,
): Deal[] {
  return deals.filter((d) => {
    if (!isWithinRange(d.createdAt, range)) return false
    if (filters.ownerId !== 'all' && d.ownerId !== filters.ownerId) return false
    if (
      filters.serviceCategoryId !== 'all' &&
      d.serviceCategoryId !== filters.serviceCategoryId
    ) {
      return false
    }
    if (filters.departmentId !== 'all') {
      const dept = categoriesById.get(d.serviceCategoryId)?.departmentId
      if (dept && dept !== filters.departmentId) return false
    }
    return true
  })
}

export function filterOrders(
  orders: Order[],
  range: Pick<DateRange, 'start' | 'end'>,
  filters: Pick<GlobalFilters, 'ownerId'>,
): Order[] {
  return orders.filter(
    (o) =>
      isWithinRange(o.createdAt, range) &&
      (filters.ownerId === 'all' || o.ownerId === filters.ownerId),
  )
}

export function filterPayments(
  payments: Payment[],
  range: Pick<DateRange, 'start' | 'end'>,
): Payment[] {
  return payments.filter((p) => isWithinRange(p.paidAt ?? p.createdAt, range))
}

export function categoryMap(data: AnalyticsDataset) {
  return new Map(data.serviceCategories.map((c) => [c.id, c]))
}
