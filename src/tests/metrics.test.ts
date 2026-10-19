import { describe, expect, it } from 'vitest'
import { seedDataset } from '../data/seed/dataset'
import { validateDataset } from '../lib/validation/seed-validation'
import { buildPresetRange, previousPeriod } from '../lib/dates/date-range'
import { SEED_ANCHOR } from '../data/seed/dataset'
import { computeLeadKpis } from '../features/leads/lead-metrics'
import {
  computeDealRevenueKpis,
  filteredCollectedRevenue,
  invoicesGenerated,
  orderBalance,
} from '../features/deals/deal-metrics'
import { computeQuotationKpis } from '../features/quotations/quotation-metrics'

const filters = {
  ownerId: 'all' as const,
  departmentId: 'all' as const,
  serviceCategoryId: 'all' as const,
}

describe('seed integrity', () => {
  it('has no foreign-key errors', () => {
    const errors = validateDataset(seedDataset).filter((i) => i.level === 'error')
    expect(errors).toEqual([])
  })

  it('includes multi-child relationships', () => {
    const multiQuotes = seedDataset.leads.some(
      (l) => seedDataset.quotations.filter((q) => q.leadId === l.id).length > 1,
    )
    const multiOrders = seedDataset.deals.some(
      (d) => seedDataset.orders.filter((o) => o.dealId === d.id).length > 1,
    )
    const multiPays = seedDataset.orders.some(
      (o) => seedDataset.payments.filter((p) => p.orderId === o.id).length > 1,
    )
    expect(multiQuotes).toBe(true)
    expect(multiOrders).toBe(true)
    expect(multiPays).toBe(true)
  })
})

describe('business metrics', () => {
  const range = buildPresetRange('last_30', SEED_ANCHOR)
  const prev = previousPeriod(range)

  it('computes lead KPIs without NaN', () => {
    const kpis = computeLeadKpis(seedDataset, range, prev, filters)
    expect(Number.isFinite(kpis.conversionRate)).toBe(true)
    expect(kpis.comparisons.total.label).not.toMatch(/Infinity|NaN/)
  })

  it('computes quotation and deal KPIs from the same filter window', () => {
    const quotes = computeQuotationKpis(seedDataset, range, prev, filters)
    const deals = computeDealRevenueKpis(seedDataset, range, prev, filters)
    expect(quotes.created).toBeGreaterThan(0)
    expect(deals.dealsCreated).toBeGreaterThan(0)
    expect(deals.outstandingRevenue).toBeGreaterThanOrEqual(0)
  })

  it('floors order balance at zero', () => {
    expect(
      orderBalance(1000, [
        {
          id: 'p1',
          reference: 'P-1',
          orderId: 'o1',
          amount: 1500,
          status: 'completed',
          method: 'upi',
          createdAt: '2026-10-01T00:00:00.000Z',
          paidAt: '2026-10-01T00:00:00.000Z',
        },
      ]),
    ).toBe(0)
  })

  it('scopes collected revenue and invoices to owner filters', () => {
    const all = filteredCollectedRevenue(seedDataset, range, filters)
    const ownerId = seedDataset.users.find((u) => u.role === 'sales')!.id
    const scoped = filteredCollectedRevenue(seedDataset, range, {
      ...filters,
      ownerId,
    })
    expect(scoped).toBeLessThanOrEqual(all)
    expect(invoicesGenerated(seedDataset, range, filters)).toBeGreaterThan(0)
    const deals = computeDealRevenueKpis(seedDataset, range, prev, filters)
    expect(deals.invoicesGenerated).toBe(
      invoicesGenerated(seedDataset, range, filters),
    )
  })

  it('excludes non-completed payments from collected revenue', () => {
    const collected = filteredCollectedRevenue(seedDataset, range, filters)
    const completedSum = seedDataset.payments
      .filter((p) => p.status === 'completed' && p.paidAt)
      .reduce((s, p) => s + p.amount, 0)
    expect(collected).toBeLessThanOrEqual(completedSum)
  })
})
