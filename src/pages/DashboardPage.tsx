import {
  CheckCircle2,
  FileText,
  Target,
  TrendingUp,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'
import { useMemo } from 'react'
import { LeadFunnelChart } from '../components/charts/lead-funnel-chart'
import { LeadSourceChart } from '../components/charts/lead-source-chart'
import { LeadTrendChart } from '../components/charts/lead-trend-chart'
import {
  QuotationsByServiceChart,
  QuotationValueChart,
  QuoteToDealGauge,
} from '../components/charts/quotation-charts'
import {
  DailyRevenueTrendChart,
  DealsVsRevenueChart,
  OrderProgressChart,
  RevenueByServiceChart,
} from '../components/charts/revenue-charts'
import { RecordDrawer } from '../components/drilldown/RecordDrawer'
import { GlobalFiltersBar } from '../components/layout/global-filters'
import { PageHeader } from '../components/layout/page-header'
import { Card, CardTitle } from '../components/ui/card'
import { DataTable } from '../components/ui/data-table'
import { KpiCard } from '../components/ui/kpi-card'
import { formatDateTime, isWithinRange, previousPeriod } from '../lib/dates/date-range'
import { downloadCsv, toCsv } from '../lib/export/csv'
import { formatINR } from '../lib/format/currency'
import { formatNumber, formatPercent } from '../lib/format/number'
import {
  computeDealRevenueKpis,
  dailyRevenueTrend,
  dealsByService,
  priorityBreakdown,
  revenueByService,
} from '../features/deals/deal-metrics'
import { useFilters } from '../features/filters/FilterContext'
import {
  computeLeadKpis,
  leadDailyTrend,
  leadSourceBreakdown,
  leadStatusDistribution,
  salesTeamActivity,
} from '../features/leads/lead-metrics'
import {
  operationsTeamActivity,
  ordersByServiceProgress,
  paymentHistoryRows,
} from '../features/orders/order-metrics'
import {
  computeQuotationKpis,
  quotationValueShare,
  quotationsByService,
} from '../features/quotations/quotation-metrics'
import type { AnalyticsDataset } from '../types/domain'

type Source = 'mock' | 'supabase'

export function DashboardPage({
  data,
  source,
  warning,
}: {
  data: AnalyticsDataset
  source: Source
  warning?: string
}) {
  const { filters, setDrill } = useFilters()
  const prev = useMemo(() => previousPeriod(filters.dateRange), [filters.dateRange])
  const filterSlice = useMemo(
    () => ({
      ownerId: filters.ownerId,
      departmentId: filters.departmentId,
      serviceCategoryId: filters.serviceCategoryId,
    }),
    [filters.ownerId, filters.departmentId, filters.serviceCategoryId],
  )

  const leadKpis = useMemo(
    () => computeLeadKpis(data, filters.dateRange, prev, filterSlice),
    [data, filters.dateRange, prev, filterSlice],
  )
  const quoteKpis = useMemo(
    () => computeQuotationKpis(data, filters.dateRange, prev, filterSlice),
    [data, filters.dateRange, prev, filterSlice],
  )
  const dealKpis = useMemo(
    () => computeDealRevenueKpis(data, filters.dateRange, prev, filterSlice),
    [data, filters.dateRange, prev, filterSlice],
  )
  const funnel = useMemo(
    () => leadStatusDistribution(data, filters.dateRange, filterSlice),
    [data, filters.dateRange, filterSlice],
  )
  const trend = useMemo(
    () => leadDailyTrend(data, filters.dateRange, filterSlice),
    [data, filters.dateRange, filterSlice],
  )
  const sources = useMemo(
    () => leadSourceBreakdown(data, filters.dateRange, filterSlice),
    [data, filters.dateRange, filterSlice],
  )
  const quoteByService = useMemo(
    () => quotationsByService(data, filters.dateRange, filterSlice),
    [data, filters.dateRange, filterSlice],
  )
  const quoteValues = useMemo(
    () => quotationValueShare(data, filters.dateRange, filterSlice),
    [data, filters.dateRange, filterSlice],
  )
  const dealsService = useMemo(
    () => dealsByService(data, filters.dateRange, filterSlice),
    [data, filters.dateRange, filterSlice],
  )
  const priorities = useMemo(
    () => priorityBreakdown(data, filters.dateRange, filterSlice),
    [data, filters.dateRange, filterSlice],
  )
  const dailyRev = useMemo(
    () => dailyRevenueTrend(data, filters.dateRange, filterSlice),
    [data, filters.dateRange, filterSlice],
  )
  const revByService = useMemo(
    () => revenueByService(data, filters.dateRange, filterSlice),
    [data, filters.dateRange, filterSlice],
  )
  const sales = useMemo(
    () => salesTeamActivity(data, filters.dateRange, filterSlice),
    [data, filters.dateRange, filterSlice],
  )
  const ops = useMemo(
    () => operationsTeamActivity(data, filters.dateRange),
    [data, filters.dateRange],
  )
  const orderProgress = useMemo(
    () => ordersByServiceProgress(data, filters.dateRange, filterSlice),
    [data, filters.dateRange, filterSlice],
  )
  const payments = useMemo(
    () => paymentHistoryRows(data, filters.dateRange, filterSlice).slice(0, 25),
    [data, filters.dateRange, filterSlice],
  )

  const targetAchieved = dealKpis.collectedRevenue
  const targetPct = Math.min((targetAchieved / data.monthlyRevenueTarget) * 100, 100)
  const remaining = Math.max(data.monthlyRevenueTarget - targetAchieved, 0)

  const onExport = () => {
    const csv = toCsv([
      {
        metric: 'New leads',
        value: leadKpis.total,
        previous_comparison: leadKpis.comparisons.total.label,
      },
      {
        metric: 'Qualified leads',
        value: leadKpis.qualified,
        previous_comparison: leadKpis.comparisons.qualified.label,
      },
      {
        metric: 'Converted leads',
        value: leadKpis.converted,
        previous_comparison: leadKpis.comparisons.converted.label,
      },
      {
        metric: 'Quotations created',
        value: quoteKpis.created,
        previous_comparison: quoteKpis.comparisons.created.label,
      },
      {
        metric: 'Deals created',
        value: dealKpis.dealsCreated,
        previous_comparison: dealKpis.comparisons.dealsCreated.label,
      },
      {
        metric: 'Total deal value',
        value: dealKpis.totalDealValue,
        previous_comparison: dealKpis.comparisons.totalDealValue.label,
      },
      {
        metric: 'Collected revenue',
        value: dealKpis.collectedRevenue,
        previous_comparison: dealKpis.comparisons.collectedRevenue.label,
      },
      {
        metric: 'Outstanding revenue',
        value: dealKpis.outstandingRevenue,
        previous_comparison: '',
      },
    ])
    downloadCsv(`analytics-export-${filters.dateRange.preset}.csv`, csv)
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 lg:px-8">
      <PageHeader
        title="Business Performance & Revenue Analytics"
        description="Track your leads, conversions, quotations, deals, revenue and operations in real time."
      />

      {warning ? (
        <div
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          role="status"
        >
          Data source: <strong>{source}</strong>. {warning}
        </div>
      ) : (
        <p className="mb-4 text-xs text-slate-500">Data source: {source}</p>
      )}

      <GlobalFiltersBar data={data} onExport={onExport} />

      <section className="mt-6" aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="sr-only">
          Key performance indicators
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
          <KpiCard
            title="New leads"
            value={formatNumber(leadKpis.total)}
            comparison={leadKpis.comparisons.total}
            icon={<UserPlus className="h-4 w-4" />}
          />
          <KpiCard
            title="Qualified leads"
            value={formatNumber(leadKpis.qualified)}
            comparison={leadKpis.comparisons.qualified}
            subStat={`${formatPercent(leadKpis.qualifiedRate)} qualified`}
            icon={<Users className="h-4 w-4" />}
          />
          <KpiCard
            title="Converted leads"
            value={formatNumber(leadKpis.converted)}
            comparison={leadKpis.comparisons.converted}
            subStat={`${formatPercent(leadKpis.conversionRate)} conversion`}
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <KpiCard
            title="Unqualified leads"
            value={formatNumber(leadKpis.unqualified)}
            comparison={leadKpis.comparisons.unqualified}
            subStat={`${formatPercent(leadKpis.unqualifiedRate)} unqualified`}
            icon={<UserMinus className="h-4 w-4" />}
          />
          <KpiCard
            title="Conversion rate"
            value={formatPercent(leadKpis.conversionRate)}
            comparison={leadKpis.comparisons.conversionRate}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <KpiCard
            title="Quotations created"
            value={formatNumber(quoteKpis.created)}
            comparison={quoteKpis.comparisons.created}
            icon={<FileText className="h-4 w-4" />}
          />
          <KpiCard
            title="Deals created"
            value={formatNumber(dealKpis.dealsCreated)}
            comparison={dealKpis.comparisons.dealsCreated}
            icon={<Target className="h-4 w-4" />}
          />
          <KpiCard
            title="Collected revenue"
            value={formatINR(dealKpis.collectedRevenue)}
            comparison={dealKpis.comparisons.collectedRevenue}
            icon={<Wallet className="h-4 w-4" />}
          />
        </div>
      </section>

      <section className="mt-8" aria-labelledby="lead-analytics">
        <h2 id="lead-analytics" className="mb-3 text-lg font-semibold text-slate-900">
          Lead analytics
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <Card>
            <CardTitle>Target achievement</CardTitle>
            <p className="mt-1 text-xs text-slate-500">
              Monthly revenue target {formatINR(data.monthlyRevenueTarget)}
            </p>
            <div className="mt-4">
              <div className="mb-2 flex justify-between text-sm">
                <span>Achieved</span>
                <span className="font-medium">
                  {formatINR(targetAchieved)} ({formatPercent(targetPct)})
                </span>
              </div>
              <div
                className="h-3 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-valuenow={Math.round(targetPct)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Target achievement"
              >
                <div
                  className="h-full rounded-full bg-blue-500 transition-[width]"
                  style={{ width: `${targetPct}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Remaining: {formatINR(remaining)} ({formatPercent(100 - targetPct)})
              </p>
            </div>
          </Card>
          <LeadFunnelChart stages={funnel.stages} unqualified={funnel.unqualified} />
          <div className="lg:col-span-2">
            <LeadTrendChart data={trend} />
          </div>
        </div>
        <div className="mt-4 max-w-xl">
          <LeadSourceChart data={sources} />
        </div>
      </section>

      <section className="mt-8" aria-labelledby="quote-analytics">
        <h2 id="quote-analytics" className="mb-3 text-lg font-semibold text-slate-900">
          Quotation analytics
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <QuotationsByServiceChart data={quoteByService} />
          <QuotationValueChart data={quoteValues} />
          <QuoteToDealGauge
            rate={quoteKpis.quoteToDealRate}
            deals={quoteKpis.convertedCount}
            quotations={quoteKpis.created}
          />
        </div>
        <Card className="mt-4">
          <CardTitle>Service-wise quotation details</CardTitle>
          <div className="mt-3">
            <DataTable
              rows={quoteByService.map((r) => ({ ...r, id: r.categoryId }))}
              searchKeys={(r) => r.name}
              searchPlaceholder="Search services…"
              columns={[
                { key: 'name', header: 'Service / order', sortable: true, sortValue: (r) => r.name, render: (r) => r.name },
                { key: 'count', header: 'Quotations', sortable: true, sortValue: (r) => r.count, render: (r) => formatNumber(r.count) },
                { key: 'amount', header: 'Quoted amount', sortable: true, sortValue: (r) => r.amount, render: (r) => formatINR(r.amount) },
                { key: 'accepted', header: 'Accepted', render: (r) => r.accepted },
                { key: 'pending', header: 'Pending', render: (r) => r.pending },
                { key: 'rejected', header: 'Rejected', render: (r) => r.rejected },
                {
                  key: 'conv',
                  header: 'Conv. rate',
                  sortable: true,
                  sortValue: (r) => r.conversionRate,
                  render: (r) => formatPercent(r.conversionRate),
                },
              ]}
            />
          </div>
        </Card>
      </section>

      <section className="mt-8" aria-labelledby="deals-revenue">
        <h2 id="deals-revenue" className="mb-3 text-lg font-semibold text-slate-900">
          Deals &amp; revenue
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DealsVsRevenueChart data={dealsService} />
          <RevenueByServiceChart data={revByService} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardTitle>Priority breakdown</CardTitle>
            <p className="mt-1 text-xs text-slate-500">Share of deal value by priority.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-2">Priority</th>
                    <th>Deals</th>
                    <th>Value</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {priorities.map((p) => (
                    <tr key={p.priority} className="border-t border-slate-100">
                      <td className="py-2 capitalize">{p.priority}</td>
                      <td>{p.count}</td>
                      <td>{formatINR(p.value)}</td>
                      <td>{formatPercent(p.valueShare)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card>
            <CardTitle>Total deal value</CardTitle>
            <p className="mt-3 text-2xl font-semibold tabular-nums">
              {formatINR(dealKpis.totalDealValue)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Sum of deal values for deals created in range (includes all stages).
            </p>
          </Card>
          <Card>
            <CardTitle>Collected vs outstanding</CardTitle>
            <p className="mt-3 text-lg font-semibold text-emerald-700">
              Collected: {formatINR(dealKpis.collectedRevenue)}
            </p>
            <p className="mt-1 text-lg font-semibold text-amber-700">
              Outstanding: {formatINR(dealKpis.outstandingRevenue)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Collected uses successful payments by paid date. Outstanding is order balance for
              deals created in range.
            </p>
          </Card>
        </div>
        <div className="mt-4">
          <DailyRevenueTrendChart data={dailyRev} />
        </div>
      </section>

      <section className="mt-8" aria-labelledby="ops">
        <h2 id="ops" className="mb-3 text-lg font-semibold text-slate-900">
          Team activity &amp; operations
        </h2>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card>
            <CardTitle>Sales team activity</CardTitle>
            <div className="mt-3">
              <DataTable
                rows={sales.map((r) => ({ ...r, id: r.userId }))}
                searchKeys={(r) => r.name}
                columns={[
                  { key: 'name', header: 'User', render: (r) => r.name },
                  { key: 'leads', header: 'Leads', render: (r) => r.leadsHandled },
                  { key: 'qual', header: 'Qualified', render: (r) => r.qualified },
                  { key: 'conv', header: 'Converted', render: (r) => r.converted },
                  {
                    key: 'rate',
                    header: 'Conv. %',
                    render: (r) => formatPercent(r.conversionRate),
                  },
                  { key: 'quotes', header: 'Quotations', render: (r) => r.quotations },
                  { key: 'deals', header: 'Deals', render: (r) => r.deals },
                  { key: 'value', header: 'Deal value', render: (r) => formatINR(r.dealValue) },
                  { key: 'rev', header: 'Revenue', render: (r) => formatINR(r.revenue) },
                ]}
              />
            </div>
          </Card>
          <Card>
            <CardTitle>Operations team activity</CardTitle>
            <div className="mt-3">
              <DataTable
                rows={ops.map((r) => ({ ...r, id: r.userId }))}
                columns={[
                  { key: 'name', header: 'User', render: (r) => r.name },
                  { key: 'orders', header: 'Orders updated', render: (r) => r.ordersUpdated },
                  { key: 'done', header: 'Stages completed', render: (r) => r.stagesCompleted },
                  { key: 'pending', header: 'Pending stages', render: (r) => r.pendingStages },
                  { key: 'overdue', header: 'Overdue orders', render: (r) => r.overdueOrders },
                ]}
              />
            </div>
          </Card>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <OrderProgressChart data={orderProgress} />
          <Card>
            <CardTitle>Recent CRM activity</CardTitle>
            <div className="mt-3">
              <DataTable
                rows={data.activity}
                onRowClick={(row) =>
                  setDrill({
                    type: row.entityType,
                    id: row.entityId,
                  })
                }
                columns={[
                  {
                    key: 'time',
                    header: 'Time',
                    render: (r) => formatDateTime(r.occurredAt),
                  },
                  {
                    key: 'user',
                    header: 'Employee',
                    render: (r) => data.users.find((u) => u.id === r.userId)?.name ?? r.userId,
                  },
                  { key: 'action', header: 'Action', render: (r) => r.action },
                  { key: 'ref', header: 'Record', render: (r) => r.entityReference },
                ]}
              />
            </div>
          </Card>
        </div>
      </section>

      <section className="mt-8 mb-10" aria-labelledby="payments">
        <h2 id="payments" className="mb-3 text-lg font-semibold text-slate-900">
          Payment history
        </h2>
        <Card>
          <DataTable
            rows={payments}
            searchKeys={(r) => `${r.reference} ${r.orderReference} ${r.status} ${r.method}`}
            searchPlaceholder="Search payments…"
            onRowClick={(row) => setDrill({ type: 'payment', id: row.id })}
            columns={[
              { key: 'ref', header: 'Payment', sortable: true, sortValue: (r) => r.reference, render: (r) => r.reference },
              { key: 'order', header: 'Order', render: (r) => r.orderReference },
              { key: 'deal', header: 'Deal', render: (r) => r.dealReference },
              {
                key: 'amount',
                header: 'Amount',
                sortable: true,
                sortValue: (r) => r.amount,
                render: (r) => formatINR(r.amount),
              },
              { key: 'status', header: 'Status', render: (r) => r.status },
              { key: 'method', header: 'Method', render: (r) => r.method },
              {
                key: 'paid',
                header: 'Paid at',
                render: (r) => (r.paidAt ? formatDateTime(r.paidAt) : '—'),
              },
            ]}
          />
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-semibold">Browse leads (drill-down)</h3>
            <DataTable
              rows={data.leads
                .filter(
                  (l) =>
                    isWithinRange(l.createdAt, filters.dateRange) &&
                    (filters.ownerId === 'all' || l.ownerId === filters.ownerId),
                )
                .slice(0, 40)}
              searchKeys={(r) => `${r.name} ${r.company ?? ''} ${r.source} ${r.status}`}
              searchPlaceholder="Search leads…"
              onRowClick={(row) => setDrill({ type: 'lead', id: row.id })}
              columns={[
                { key: 'name', header: 'Lead', render: (r) => r.name },
                { key: 'company', header: 'Company', render: (r) => r.company ?? '—' },
                { key: 'source', header: 'Source', render: (r) => r.source },
                { key: 'status', header: 'Status', render: (r) => r.status },
                {
                  key: 'owner',
                  header: 'Owner',
                  render: (r) => data.users.find((u) => u.id === r.ownerId)?.name ?? r.ownerId,
                },
              ]}
            />
          </div>
        </Card>
      </section>

      <RecordDrawer data={data} />
    </div>
  )
}
