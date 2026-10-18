import { formatDateTime, formatShortDate } from '../../lib/dates/date-range'
import { formatINR } from '../../lib/format/currency'
import { orderBalance } from '../../features/deals/deal-metrics'
import { useFilters } from '../../features/filters/FilterContext'
import type { AnalyticsDataset } from '../../types/domain'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Drawer } from '../ui/drawer'

export function RecordDrawer({ data }: { data: AnalyticsDataset }) {
  const { drill, setDrill } = useFilters()
  if (!drill) return null

  const close = () => setDrill(null)

  if (drill.type === 'lead') {
    const lead = data.leads.find((l) => l.id === drill.id)
    if (!lead) return null
    const quotes = data.quotations.filter((q) => q.leadId === lead.id)
    const deals = data.deals.filter((d) => d.leadId === lead.id)
    const owner = data.users.find((u) => u.id === lead.ownerId)
    return (
      <Drawer open title={`Lead · ${lead.name}`} onClose={close}>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">Company</dt>
            <dd className="font-medium">{lead.company ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Source</dt>
            <dd className="font-medium">{lead.source}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd>
              <Badge tone="blue">{lead.status}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Owner</dt>
            <dd className="font-medium">{owner?.name ?? lead.ownerId}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Created</dt>
            <dd>{formatShortDate(lead.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Converted</dt>
            <dd>{lead.convertedAt ? formatShortDate(lead.convertedAt) : '—'}</dd>
          </div>
        </dl>
        <h3 className="mt-6 text-sm font-semibold">Quotations ({quotes.length})</h3>
        <ul className="mt-2 space-y-2">
          {quotes.map((q) => (
            <li key={q.id}>
              <Button
                className="w-full justify-between"
                onClick={() => setDrill({ type: 'quotation', id: q.id })}
              >
                <span>{q.reference}</span>
                <span>{formatINR(q.amount)}</span>
              </Button>
            </li>
          ))}
          {quotes.length === 0 ? <li className="text-sm text-slate-500">No quotations</li> : null}
        </ul>
        <h3 className="mt-6 text-sm font-semibold">Deals ({deals.length})</h3>
        <ul className="mt-2 space-y-2">
          {deals.map((d) => (
            <li key={d.id}>
              <Button
                className="w-full justify-between"
                onClick={() => setDrill({ type: 'deal', id: d.id })}
              >
                <span>{d.reference}</span>
                <span>{formatINR(d.value)}</span>
              </Button>
            </li>
          ))}
          {deals.length === 0 ? <li className="text-sm text-slate-500">No deals</li> : null}
        </ul>
      </Drawer>
    )
  }

  if (drill.type === 'quotation') {
    const quote = data.quotations.find((q) => q.id === drill.id)
    if (!quote) return null
    const lead = data.leads.find((l) => l.id === quote.leadId)
    const cat = data.serviceCategories.find((c) => c.id === quote.serviceCategoryId)
    return (
      <Drawer open title={`Quotation · ${quote.reference}`} onClose={close}>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">Lead</dt>
            <dd>
              <Button
                variant="ghost"
                className="px-0"
                onClick={() => setDrill({ type: 'lead', id: quote.leadId })}
              >
                {lead?.name ?? quote.leadId}
              </Button>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Service</dt>
            <dd className="font-medium">{cat?.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Amount</dt>
            <dd className="font-medium">{formatINR(quote.amount)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd>
              <Badge>{quote.status}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Created</dt>
            <dd>{formatShortDate(quote.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Valid until</dt>
            <dd>{quote.validUntil ? formatShortDate(quote.validUntil) : '—'}</dd>
          </div>
        </dl>
        {quote.dealId ? (
          <Button className="mt-4" onClick={() => setDrill({ type: 'deal', id: quote.dealId! })}>
            Open linked deal
          </Button>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Not converted to a deal.</p>
        )}
      </Drawer>
    )
  }

  if (drill.type === 'deal') {
    const deal = data.deals.find((d) => d.id === drill.id)
    if (!deal) return null
    const lead = data.leads.find((l) => l.id === deal.leadId)
    const orders = data.orders.filter((o) => o.dealId === deal.id)
    const cat = data.serviceCategories.find((c) => c.id === deal.serviceCategoryId)
    return (
      <Drawer open title={`Deal · ${deal.reference}`} onClose={close}>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">Lead</dt>
            <dd>
              <Button variant="ghost" className="px-0" onClick={() => setDrill({ type: 'lead', id: deal.leadId })}>
                {lead?.name}
              </Button>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Service</dt>
            <dd className="font-medium">{cat?.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Value</dt>
            <dd className="font-medium">{formatINR(deal.value)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Priority / Stage</dt>
            <dd>
              <Badge tone="amber">{deal.priority}</Badge>{' '}
              <Badge>{deal.stage}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Progress</dt>
            <dd>{deal.progressPercent}%</dd>
          </div>
          <div>
            <dt className="text-slate-500">Created</dt>
            <dd>{formatShortDate(deal.createdAt)}</dd>
          </div>
        </dl>
        {deal.quotationId ? (
          <Button className="mt-4" onClick={() => setDrill({ type: 'quotation', id: deal.quotationId! })}>
            Open originating quotation
          </Button>
        ) : null}
        <h3 className="mt-6 text-sm font-semibold">Orders ({orders.length})</h3>
        <ul className="mt-2 space-y-2">
          {orders.map((o) => (
            <li key={o.id}>
              <Button className="w-full justify-between" onClick={() => setDrill({ type: 'order', id: o.id })}>
                <span>{o.reference}</span>
                <span>{formatINR(o.totalAmount)}</span>
              </Button>
            </li>
          ))}
        </ul>
      </Drawer>
    )
  }

  if (drill.type === 'order') {
    const order = data.orders.find((o) => o.id === drill.id)
    if (!order) return null
    const payments = data.payments.filter((p) => p.orderId === order.id)
    const balance = orderBalance(order.totalAmount, payments)
    return (
      <Drawer open title={`Order · ${order.reference}`} onClose={close}>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">Deal</dt>
            <dd>
              <Button variant="ghost" className="px-0" onClick={() => setDrill({ type: 'deal', id: order.dealId })}>
                Open deal
              </Button>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd>
              <Badge>{order.status}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Total</dt>
            <dd className="font-medium">{formatINR(order.totalAmount)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Balance due</dt>
            <dd className="font-medium">{formatINR(balance)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Progress</dt>
            <dd>{order.progressPercent}%</dd>
          </div>
          <div>
            <dt className="text-slate-500">Due</dt>
            <dd>{order.dueAt ? formatShortDate(order.dueAt) : '—'}</dd>
          </div>
        </dl>
        <h3 className="mt-6 text-sm font-semibold">Payments ({payments.length})</h3>
        <ul className="mt-2 space-y-2">
          {payments.map((p) => (
            <li key={p.id}>
              <Button className="w-full justify-between" onClick={() => setDrill({ type: 'payment', id: p.id })}>
                <span>
                  {p.reference} · {p.status}
                </span>
                <span>{formatINR(p.amount)}</span>
              </Button>
            </li>
          ))}
          {payments.length === 0 ? <li className="text-sm text-slate-500">No payments</li> : null}
        </ul>
      </Drawer>
    )
  }

  const payment = data.payments.find((p) => p.id === drill.id)
  if (!payment) return null
  return (
    <Drawer open title={`Payment · ${payment.reference}`} onClose={close}>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-500">Amount</dt>
          <dd className="font-medium">{formatINR(payment.amount)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Status</dt>
          <dd>
            <Badge tone={payment.status === 'completed' ? 'green' : 'slate'}>{payment.status}</Badge>
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Method</dt>
          <dd>{payment.method}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Paid at</dt>
          <dd>{payment.paidAt ? formatDateTime(payment.paidAt) : '—'}</dd>
        </div>
      </dl>
      <Button className="mt-4" onClick={() => setDrill({ type: 'order', id: payment.orderId })}>
        Open parent order
      </Button>
    </Drawer>
  )
}
