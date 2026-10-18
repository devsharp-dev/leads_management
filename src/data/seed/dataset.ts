import { addDays, formatISO, setHours, setMinutes, startOfDay, subDays } from 'date-fns'
import type {
  ActivityEvent,
  AnalyticsDataset,
  Deal,
  Lead,
  Order,
  Payment,
  Quotation,
} from '../../types/domain'
import { departments, leadSources, serviceCategories, users } from './reference-data'
import { createPrng, intBetween, pick } from './prng'

/** Anchor date matching assignment reference window (Oct 2026). */
export const SEED_ANCHOR = startOfDay(new Date('2026-10-18T12:00:00.00Z'))

function isoAt(dayOffset: number, hour: number, minute: number): string {
  const day = addDays(SEED_ANCHOR, dayOffset)
  return formatISO(setMinutes(setHours(day, hour), minute))
}

const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan',
  'Krishna', 'Ishaan', 'Ananya', 'Diya', 'Myra', 'Aadhya', 'Pari', 'Saanvi',
  'Kiara', 'Ira', 'Navya', 'Meera',
]
const lastNames = [
  'Sharma', 'Patel', 'Singh', 'Gupta', 'Kumar', 'Reddy', 'Nair', 'Iyer',
  'Joshi', 'Chopra', 'Malhotra', 'Banerjee', 'Desai', 'Kapoor', 'Verma',
]
const companies = [
  'NovaTech Pvt Ltd', 'BrightPath LLP', 'Coastal Foods', 'UrbanNest Homes',
  'PixelCraft Studio', 'GreenLeaf Organics', 'Summit Logistics', 'Arya Legal',
  'Orbit FinServ', 'Cedar Health', 'BluePeak Media', 'Zenith Retail',
]

/**
 * Builds a deterministic relational dataset spanning ~60 days around the
 * seed anchor so Today / Last 7 / Last 30 / previous-period comparisons work.
 */
export function buildSeedDataset(): AnalyticsDataset {
  const rand = createPrng(20261018)
  const salesOwners = users.filter((u) => u.role === 'sales')
  const opsOwners = users.filter((u) => u.role === 'operations')

  const leads: Lead[] = []
  const quotations: Quotation[] = []
  const deals: Deal[] = []
  const orders: Order[] = []
  const payments: Payment[] = []
  const activity: ActivityEvent[] = []

  let leadSeq = 209500
  let quoteSeq = 5000
  let dealSeq = 800
  let orderSeq = 2100
  let paySeq = 9000
  let actSeq = 1

  // Dense current-month window (day offsets -45..0 relative to anchor)
  for (let i = 0; i < 120; i += 1) {
    const dayOffset = -intBetween(rand, 0, 45)
    const createdAt = isoAt(dayOffset, intBetween(rand, 9, 18), intBetween(rand, 0, 59))
    const owner = pick(rand, salesOwners)
    const source = pick(rand, leadSources)
    // Bias Google Ads / Website like the reference screenshot
    const biasedSource =
      rand() < 0.55 ? 'Google Ads' : rand() < 0.75 ? 'Website' : source
    const statusRoll = rand()
    let status: Lead['status'] = 'new'
    let convertedAt: string | undefined
    let qualifiedAt: string | undefined
    let unqualifiedAt: string | undefined

    if (statusRoll < 0.22) {
      status = 'converted'
      qualifiedAt = isoAt(dayOffset + 1, 11, 0)
      convertedAt = isoAt(Math.min(dayOffset + intBetween(rand, 2, 8), 0), 15, 30)
    } else if (statusRoll < 0.42) {
      status = 'qualified'
      qualifiedAt = isoAt(Math.min(dayOffset + 1, 0), 12, 0)
    } else if (statusRoll < 0.62) {
      status = 'unqualified'
      unqualifiedAt = isoAt(Math.min(dayOffset + 1, 0), 10, 0)
    } else if (statusRoll < 0.78) {
      status = 'contacted'
    }

    const id = `lead-${leadSeq}`
    leadSeq += 1
    const first = pick(rand, firstNames)
    const last = pick(rand, lastNames)
    leads.push({
      id,
      name: `${first} ${last}`,
      company: rand() > 0.25 ? pick(rand, companies) : undefined,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      phone: `+91${intBetween(rand, 7000000000, 9999999999)}`,
      source: biasedSource,
      status,
      ownerId: owner.id,
      departmentId: owner.departmentId,
      createdAt,
      updatedAt: convertedAt ?? qualifiedAt ?? unqualifiedAt ?? createdAt,
      convertedAt,
      qualifiedAt,
      unqualifiedAt,
    })

    activity.push({
      id: `act-${actSeq++}`,
      occurredAt: createdAt,
      userId: owner.id,
      action: 'Lead created',
      entityType: 'lead',
      entityId: id,
      entityReference: `#L-${leadSeq - 1}`,
    })
  }

  // Extra leads in previous period with zero-ish edge cases for some sources
  for (let i = 0; i < 35; i += 1) {
    const dayOffset = -intBetween(rand, 31, 60)
    const owner = pick(rand, salesOwners)
    const id = `lead-${leadSeq++}`
    const createdAt = isoAt(dayOffset, 10, 15)
    leads.push({
      id,
      name: `${pick(rand, firstNames)} ${pick(rand, lastNames)}`,
      source: pick(rand, ['Website', 'Referral', 'LinkedIn'] as const),
      status: pick(rand, ['new', 'contacted', 'qualified', 'converted', 'unqualified'] as const),
      ownerId: owner.id,
      departmentId: owner.departmentId,
      createdAt,
      updatedAt: createdAt,
      convertedAt: undefined,
      qualifiedAt: undefined,
    })
  }

  // Multi-quotation / multi-deal leads: ensure a few leads have 2+ quotes and deals
  const multiLeadIds = leads.slice(0, 12).map((l) => l.id)

  for (const lead of leads) {
    const quoteCount =
      multiLeadIds.includes(lead.id)
        ? intBetween(rand, 2, 4)
        : rand() < 0.7
          ? 1
          : rand() < 0.85
            ? 2
            : 0

    for (let q = 0; q < quoteCount; q += 1) {
      const svc = pick(rand, serviceCategories)
      const leadDay = Math.round(
        (new Date(lead.createdAt).getTime() - SEED_ANCHOR.getTime()) /
          (24 * 60 * 60 * 1000),
      )
      const createdOffset = Math.min(0, leadDay + intBetween(rand, 0, 4))
      const amount = intBetween(rand, 5000, 85000)
      const statusRoll = rand()
      let status: Quotation['status'] = 'sent'
      let acceptedAt: string | undefined

      if (statusRoll < 0.28) {
        status = 'accepted'
        acceptedAt = isoAt(Math.min(createdOffset + 2, 0), 14, 0)
      } else if (statusRoll < 0.45) {
        status = 'pending'
      } else if (statusRoll < 0.58) {
        status = 'rejected'
      } else if (statusRoll < 0.68) {
        status = 'draft'
      } else if (statusRoll < 0.75) {
        status = 'expired'
      }

      const qid = `quote-${quoteSeq}`
      const reference = `Q-${quoteSeq}`
      quoteSeq += 1

      quotations.push({
        id: qid,
        reference,
        leadId: lead.id,
        serviceCategoryId: svc.id,
        ownerId: lead.ownerId,
        status,
        amount,
        createdAt: isoAt(createdOffset, intBetween(rand, 9, 17), intBetween(rand, 0, 59)),
        validUntil: isoAt(createdOffset + 14, 23, 59),
        acceptedAt,
      })
    }
  }

  // Create deals from accepted quotations + some direct deals
  const acceptedQuotes = quotations.filter((q) => q.status === 'accepted')
  for (const quote of acceptedQuotes) {
    if (rand() > 0.72) continue
    const lead = leads.find((l) => l.id === quote.leadId)!
    const createdOffset = Math.min(
      0,
      Math.round(
        (new Date(quote.acceptedAt ?? quote.createdAt).getTime() -
          SEED_ANCHOR.getTime()) /
          (24 * 60 * 60 * 1000),
      ) + intBetween(rand, 0, 2),
    )
    const did = `deal-${dealSeq}`
    const reference = `D-${dealSeq}`
    dealSeq += 1
    const priority = pick(rand, ['high', 'medium', 'low'] as const)
    const stage = pick(rand, ['prospecting', 'proposal', 'negotiation', 'won', 'lost'] as const)
    const value = Math.round(quote.amount * (0.85 + rand() * 0.3))
    deals.push({
      id: did,
      reference,
      leadId: lead.id,
      quotationId: quote.id,
      serviceCategoryId: quote.serviceCategoryId,
      ownerId: lead.ownerId,
      priority: priority === 'low' && rand() < 0.7 ? 'medium' : priority,
      stage,
      value,
      progressPercent: stage === 'won' ? 100 : stage === 'lost' ? intBetween(rand, 10, 40) : intBetween(rand, 15, 90),
      createdAt: isoAt(createdOffset, 11, 30),
      expectedCloseAt: isoAt(createdOffset + intBetween(rand, 5, 20), 18, 0),
      closedAt: stage === 'won' || stage === 'lost' ? isoAt(Math.min(createdOffset + 5, 0), 16, 0) : undefined,
    })
    quote.dealId = did
    activity.push({
      id: `act-${actSeq++}`,
      occurredAt: isoAt(createdOffset, 11, 45),
      userId: lead.ownerId,
      action: 'Deal created',
      entityType: 'deal',
      entityId: did,
      entityReference: `#${reference}`,
    })
  }

  // Extra deals without quotation for some converted leads
  for (const lead of leads.filter((l) => l.status === 'converted').slice(0, 15)) {
    if (deals.some((d) => d.leadId === lead.id) && rand() > 0.35) continue
    const svc = pick(rand, serviceCategories)
    const leadDay = Math.round(
      (new Date(lead.convertedAt ?? lead.createdAt).getTime() - SEED_ANCHOR.getTime()) /
        (24 * 60 * 60 * 1000),
    )
    const did = `deal-${dealSeq}`
    const reference = `D-${dealSeq}`
    dealSeq += 1
    deals.push({
      id: did,
      reference,
      leadId: lead.id,
      serviceCategoryId: svc.id,
      ownerId: lead.ownerId,
      priority: pick(rand, ['high', 'medium'] as const),
      stage: 'won',
      value: intBetween(rand, 8000, 60000),
      progressPercent: 100,
      createdAt: isoAt(Math.min(leadDay, 0), 13, 0),
      closedAt: isoAt(Math.min(leadDay + 1, 0), 17, 0),
    })
  }

  // Ensure a few leads have multiple deals
  for (const leadId of multiLeadIds.slice(0, 5)) {
    const existing = deals.filter((d) => d.leadId === leadId)
    if (existing.length >= 2) continue
    const lead = leads.find((l) => l.id === leadId)!
    const svc = pick(rand, serviceCategories)
    const did = `deal-${dealSeq}`
    deals.push({
      id: did,
      reference: `D-${dealSeq++}`,
      leadId,
      serviceCategoryId: svc.id,
      ownerId: lead.ownerId,
      priority: 'high',
      stage: 'negotiation',
      value: intBetween(rand, 12000, 45000),
      progressPercent: 55,
      createdAt: isoAt(-intBetween(rand, 1, 10), 12, 0),
    })
  }

  for (const deal of deals) {
    const orderCount =
      multiLeadIds.includes(deal.leadId) || rand() < 0.25
        ? intBetween(rand, 2, 3)
        : 1
    for (let o = 0; o < orderCount; o += 1) {
      const dealDay = Math.round(
        (new Date(deal.createdAt).getTime() - SEED_ANCHOR.getTime()) /
          (24 * 60 * 60 * 1000),
      )
      const createdOffset = Math.min(0, dealDay + intBetween(rand, 0, 3))
      const oid = `order-${orderSeq}`
      const reference = `O-${orderSeq}`
      orderSeq += 1
      const status = pick(rand, [
        'pending',
        'in_progress',
        'completed',
        'on_hold',
        'cancelled',
      ] as const)
      const totalAmount = Math.round(deal.value / orderCount)
      const owner = pick(rand, opsOwners)
      const completedAt =
        status === 'completed'
          ? isoAt(Math.min(createdOffset + intBetween(rand, 1, 6), 0), 16, 0)
          : undefined
      orders.push({
        id: oid,
        reference,
        dealId: deal.id,
        ownerId: owner.id,
        status,
        totalAmount,
        progressPercent:
          status === 'completed'
            ? 100
            : status === 'cancelled'
              ? intBetween(rand, 0, 30)
              : intBetween(rand, 10, 85),
        createdAt: isoAt(createdOffset, 10, 0),
        dueAt: isoAt(createdOffset + intBetween(rand, 3, 14), 18, 0),
        completedAt,
      })
      activity.push({
        id: `act-${actSeq++}`,
        occurredAt: isoAt(createdOffset, 10, 20),
        userId: owner.id,
        action: 'Order created',
        entityType: 'order',
        entityId: oid,
        entityReference: `#${reference}`,
      })
    }
  }

  for (const order of orders) {
    if (order.status === 'cancelled') continue
    const payCount = rand() < 0.35 ? 2 : rand() < 0.7 ? 1 : 0
    let remaining = order.totalAmount
    for (let p = 0; p < payCount; p += 1) {
      const orderDay = Math.round(
        (new Date(order.createdAt).getTime() - SEED_ANCHOR.getTime()) /
          (24 * 60 * 60 * 1000),
      )
      const paidOffset = Math.min(0, orderDay + intBetween(rand, 0, 5))
      const isLast = p === payCount - 1
      const amount = isLast
        ? Math.max(1000, Math.round(remaining * (0.4 + rand() * 0.6)))
        : Math.round(order.totalAmount * (0.3 + rand() * 0.3))
      remaining = Math.max(0, remaining - amount)
      const statusRoll = rand()
      const status: Payment['status'] =
        statusRoll < 0.78
          ? 'completed'
          : statusRoll < 0.88
            ? 'pending'
            : statusRoll < 0.95
              ? 'failed'
              : 'refunded'
      const pid = `pay-${paySeq}`
      payments.push({
        id: pid,
        reference: `P-${paySeq++}`,
        orderId: order.id,
        amount,
        status,
        method: pick(rand, ['upi', 'bank_transfer', 'card', 'cash', 'other'] as const),
        paidAt: status === 'completed' || status === 'refunded' ? isoAt(paidOffset, 12, 30) : undefined,
        createdAt: isoAt(paidOffset, 12, 0),
      })
    }
  }

  // Sort activity newest first slice
  activity.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )

  return {
    departments,
    serviceCategories,
    users,
    leads,
    quotations,
    deals,
    orders,
    payments,
    activity: activity.slice(0, 40),
    monthlyRevenueTarget: 8_500_000,
  }
}

/** Singleton deterministic dataset. */
export const seedDataset: AnalyticsDataset = buildSeedDataset()

export function seedSummary(data: AnalyticsDataset = seedDataset) {
  return {
    leads: data.leads.length,
    quotations: data.quotations.length,
    deals: data.deals.length,
    orders: data.orders.length,
    payments: data.payments.length,
    users: data.users.length,
    categories: data.serviceCategories.length,
    departments: data.departments.length,
    anchor: formatISO(SEED_ANCHOR),
    oldestLead: data.leads.reduce(
      (min, l) => (l.createdAt < min ? l.createdAt : min),
      data.leads[0]!.createdAt,
    ),
  }
}

// Keep subDays import used for potential future relative helpers
void subDays
