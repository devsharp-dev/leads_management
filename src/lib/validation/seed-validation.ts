import type { AnalyticsDataset } from '../../types/domain'

export interface ValidationIssue {
  level: 'error' | 'warning'
  message: string
}

export function validateDataset(data: AnalyticsDataset): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const deptIds = new Set(data.departments.map((d) => d.id))
  const userIds = new Set(data.users.map((u) => u.id))
  const catIds = new Set(data.serviceCategories.map((c) => c.id))
  const leadIds = new Set(data.leads.map((l) => l.id))
  const quoteIds = new Set(data.quotations.map((q) => q.id))
  const dealIds = new Set(data.deals.map((d) => d.id))
  const orderIds = new Set(data.orders.map((o) => o.id))

  for (const cat of data.serviceCategories) {
    if (cat.departmentId && !deptIds.has(cat.departmentId)) {
      issues.push({ level: 'error', message: `Category ${cat.id} has invalid department` })
    }
  }
  for (const user of data.users) {
    if (user.departmentId && !deptIds.has(user.departmentId)) {
      issues.push({ level: 'error', message: `User ${user.id} has invalid department` })
    }
  }
  for (const lead of data.leads) {
    if (!userIds.has(lead.ownerId)) {
      issues.push({ level: 'error', message: `Lead ${lead.id} has invalid owner` })
    }
  }
  for (const q of data.quotations) {
    if (!leadIds.has(q.leadId)) issues.push({ level: 'error', message: `Quote ${q.id} bad lead` })
    if (!catIds.has(q.serviceCategoryId)) {
      issues.push({ level: 'error', message: `Quote ${q.id} bad category` })
    }
    if (q.amount < 0) issues.push({ level: 'error', message: `Quote ${q.id} negative amount` })
    if (q.dealId && !dealIds.has(q.dealId)) {
      issues.push({ level: 'error', message: `Quote ${q.id} bad dealId` })
    }
  }
  for (const d of data.deals) {
    if (!leadIds.has(d.leadId)) issues.push({ level: 'error', message: `Deal ${d.id} bad lead` })
    if (d.quotationId && !quoteIds.has(d.quotationId)) {
      issues.push({ level: 'error', message: `Deal ${d.id} bad quotation` })
    }
    if (d.value < 0) issues.push({ level: 'error', message: `Deal ${d.id} negative value` })
    if (d.progressPercent < 0 || d.progressPercent > 100) {
      issues.push({ level: 'error', message: `Deal ${d.id} bad progress` })
    }
  }
  for (const o of data.orders) {
    if (!dealIds.has(o.dealId)) issues.push({ level: 'error', message: `Order ${o.id} bad deal` })
    if (o.totalAmount < 0) issues.push({ level: 'error', message: `Order ${o.id} negative` })
    if (o.progressPercent < 0 || o.progressPercent > 100) {
      issues.push({ level: 'error', message: `Order ${o.id} bad progress` })
    }
  }
  for (const p of data.payments) {
    if (!orderIds.has(p.orderId)) {
      issues.push({ level: 'error', message: `Payment ${p.id} bad order` })
    }
    if (p.amount < 0) issues.push({ level: 'error', message: `Payment ${p.id} negative` })
  }

  const multiQuoteLeads = data.leads.filter(
    (l) => data.quotations.filter((q) => q.leadId === l.id).length > 1,
  )
  if (multiQuoteLeads.length === 0) {
    issues.push({ level: 'warning', message: 'No lead with multiple quotations' })
  }
  const multiOrderDeals = data.deals.filter(
    (d) => data.orders.filter((o) => o.dealId === d.id).length > 1,
  )
  if (multiOrderDeals.length === 0) {
    issues.push({ level: 'warning', message: 'No deal with multiple orders' })
  }

  return issues
}
