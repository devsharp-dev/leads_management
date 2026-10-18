import type { AnalyticsDataset } from '../types/domain'
import { getSupabaseClient, supabaseConfigured } from '../lib/supabase'
import { loadMockDataset } from './mock-repository'

export type DataSource = 'mock' | 'supabase'

export interface LoadResult {
  data: AnalyticsDataset
  source: DataSource
  warning?: string
}

async function loadFromSupabase(): Promise<LoadResult | null> {
  const client = getSupabaseClient()
  if (!client) return null

  const [
    departments,
    serviceCategories,
    users,
    leads,
    quotations,
    deals,
    orders,
    payments,
    activity,
  ] = await Promise.all([
    client.from('departments').select('*'),
    client.from('service_categories').select('*'),
    client.from('users').select('*'),
    client.from('leads').select('*'),
    client.from('quotations').select('*'),
    client.from('deals').select('*'),
    client.from('orders').select('*'),
    client.from('payments').select('*'),
    client.from('activity_events').select('*').order('occurred_at', { ascending: false }).limit(40),
  ])

  const firstError = [
    departments,
    serviceCategories,
    users,
    leads,
    quotations,
    deals,
    orders,
    payments,
    activity,
  ].find((r) => r.error)

  if (firstError?.error) {
    throw new Error(firstError.error.message)
  }

  const mapUser = (row: Record<string, unknown>) => ({
    id: String(row.id),
    name: String(row.name),
    role: row.role as 'sales' | 'operations' | 'admin',
    departmentId: row.department_id ? String(row.department_id) : undefined,
  })

  const data: AnalyticsDataset = {
    departments: (departments.data ?? []).map((r) => ({
      id: String(r.id),
      name: String(r.name),
    })),
    serviceCategories: (serviceCategories.data ?? []).map((r) => ({
      id: String(r.id),
      name: String(r.name),
      departmentId: r.department_id ? String(r.department_id) : undefined,
    })),
    users: (users.data ?? []).map((r) => mapUser(r as Record<string, unknown>)),
    leads: (leads.data ?? []).map((r) => ({
      id: String(r.id),
      name: String(r.name),
      company: r.company ? String(r.company) : undefined,
      email: r.email ? String(r.email) : undefined,
      phone: r.phone ? String(r.phone) : undefined,
      source: String(r.source),
      status: r.status as AnalyticsDataset['leads'][number]['status'],
      ownerId: String(r.owner_id),
      departmentId: r.department_id ? String(r.department_id) : undefined,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
      convertedAt: r.converted_at ? String(r.converted_at) : undefined,
      qualifiedAt: r.qualified_at ? String(r.qualified_at) : undefined,
      unqualifiedAt: r.unqualified_at ? String(r.unqualified_at) : undefined,
    })),
    quotations: (quotations.data ?? []).map((r) => ({
      id: String(r.id),
      reference: String(r.reference),
      leadId: String(r.lead_id),
      serviceCategoryId: String(r.service_category_id),
      ownerId: String(r.owner_id),
      status: r.status as AnalyticsDataset['quotations'][number]['status'],
      amount: Number(r.amount),
      createdAt: String(r.created_at),
      validUntil: r.valid_until ? String(r.valid_until) : undefined,
      acceptedAt: r.accepted_at ? String(r.accepted_at) : undefined,
      dealId: r.deal_id ? String(r.deal_id) : undefined,
    })),
    deals: (deals.data ?? []).map((r) => ({
      id: String(r.id),
      reference: String(r.reference),
      leadId: String(r.lead_id),
      quotationId: r.quotation_id ? String(r.quotation_id) : undefined,
      serviceCategoryId: String(r.service_category_id),
      ownerId: String(r.owner_id),
      priority: r.priority as AnalyticsDataset['deals'][number]['priority'],
      stage: r.stage as AnalyticsDataset['deals'][number]['stage'],
      value: Number(r.value),
      progressPercent: Number(r.progress_percent),
      createdAt: String(r.created_at),
      expectedCloseAt: r.expected_close_at ? String(r.expected_close_at) : undefined,
      closedAt: r.closed_at ? String(r.closed_at) : undefined,
    })),
    orders: (orders.data ?? []).map((r) => ({
      id: String(r.id),
      reference: String(r.reference),
      dealId: String(r.deal_id),
      ownerId: String(r.owner_id),
      status: r.status as AnalyticsDataset['orders'][number]['status'],
      totalAmount: Number(r.total_amount),
      progressPercent: Number(r.progress_percent),
      createdAt: String(r.created_at),
      dueAt: r.due_at ? String(r.due_at) : undefined,
      completedAt: r.completed_at ? String(r.completed_at) : undefined,
    })),
    payments: (payments.data ?? []).map((r) => ({
      id: String(r.id),
      reference: String(r.reference),
      orderId: String(r.order_id),
      amount: Number(r.amount),
      status: r.status as AnalyticsDataset['payments'][number]['status'],
      method: r.method as AnalyticsDataset['payments'][number]['method'],
      paidAt: r.paid_at ? String(r.paid_at) : undefined,
      createdAt: String(r.created_at),
    })),
    activity: (activity.data ?? []).map((r) => ({
      id: String(r.id),
      occurredAt: String(r.occurred_at),
      userId: String(r.user_id),
      action: String(r.action),
      entityType: r.entity_type as AnalyticsDataset['activity'][number]['entityType'],
      entityId: String(r.entity_id),
      entityReference: String(r.entity_reference),
    })),
    monthlyRevenueTarget: 8_500_000,
  }

  if (data.leads.length === 0) {
    return {
      ...(await loadMockDataset()),
      warning: 'Supabase returned empty tables; using mock seed dataset.',
    }
  }

  return { data, source: 'supabase' }
}

/**
 * Single entry point for dashboard data.
 * Uses Supabase when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set;
 * otherwise falls back to the deterministic mock repository.
 */
export async function loadAnalyticsDataset(): Promise<LoadResult> {
  if (!supabaseConfigured) {
    const mock = await loadMockDataset()
    return {
      ...mock,
      warning:
        'Supabase credentials not configured. Using isolated mock repository (deterministic seed).',
    }
  }

  try {
    const live = await loadFromSupabase()
    if (live) return live
  } catch (error) {
    const mock = await loadMockDataset()
    return {
      ...mock,
      warning: `Supabase load failed (${error instanceof Error ? error.message : 'unknown'}); using mock repository.`,
    }
  }

  return loadMockDataset()
}
