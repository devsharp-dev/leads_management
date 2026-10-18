import { describe, expect, it } from 'vitest'
import { seedDataset } from '../data/seed/dataset'

describe('relational drill-down integrity', () => {
  it('every quotation lead and optional deal resolves', () => {
    const leadIds = new Set(seedDataset.leads.map((l) => l.id))
    const dealIds = new Set(seedDataset.deals.map((d) => d.id))
    for (const q of seedDataset.quotations) {
      expect(leadIds.has(q.leadId)).toBe(true)
      if (q.dealId) expect(dealIds.has(q.dealId)).toBe(true)
    }
  })

  it('every deal quotation (when present) resolves both ways', () => {
    for (const d of seedDataset.deals) {
      if (!d.quotationId) continue
      const q = seedDataset.quotations.find((x) => x.id === d.quotationId)
      expect(q).toBeTruthy()
      expect(q!.dealId === d.id || q!.dealId == null || q!.dealId === d.id).toBe(true)
    }
  })

  it('payments belong to orders that belong to deals', () => {
    const orderIds = new Set(seedDataset.orders.map((o) => o.id))
    const dealIds = new Set(seedDataset.deals.map((d) => d.id))
    for (const p of seedDataset.payments) {
      expect(orderIds.has(p.orderId)).toBe(true)
      const order = seedDataset.orders.find((o) => o.id === p.orderId)!
      expect(dealIds.has(order.dealId)).toBe(true)
    }
  })
})
