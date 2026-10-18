export type ID = string

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'converted'
  | 'unqualified'

export type QuotationStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'pending'
  | 'rejected'
  | 'expired'

export type DealStage =
  | 'prospecting'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'

export type Priority = 'high' | 'medium' | 'low'

export type OrderStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'on_hold'
  | 'cancelled'

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export type PaymentMethod =
  | 'bank_transfer'
  | 'card'
  | 'cash'
  | 'upi'
  | 'other'

export interface Department {
  id: ID
  name: string
}

export interface ServiceCategory {
  id: ID
  name: string
  departmentId?: ID
}

export interface User {
  id: ID
  name: string
  role: 'sales' | 'operations' | 'admin'
  departmentId?: ID
}

export interface Lead {
  id: ID
  name: string
  company?: string
  email?: string
  phone?: string
  source: string
  status: LeadStatus
  ownerId: ID
  departmentId?: ID
  createdAt: string
  updatedAt: string
  convertedAt?: string
  qualifiedAt?: string
  unqualifiedAt?: string
}

export interface Quotation {
  id: ID
  reference: string
  leadId: ID
  serviceCategoryId: ID
  ownerId: ID
  status: QuotationStatus
  /** Amount in INR (whole rupees). */
  amount: number
  createdAt: string
  validUntil?: string
  acceptedAt?: string
  dealId?: ID
}

export interface Deal {
  id: ID
  reference: string
  leadId: ID
  quotationId?: ID
  serviceCategoryId: ID
  ownerId: ID
  priority: Priority
  stage: DealStage
  /** Deal value in INR (whole rupees). */
  value: number
  progressPercent: number
  createdAt: string
  expectedCloseAt?: string
  closedAt?: string
}

export interface Order {
  id: ID
  reference: string
  dealId: ID
  ownerId: ID
  status: OrderStatus
  /** Order total in INR (whole rupees). */
  totalAmount: number
  progressPercent: number
  createdAt: string
  dueAt?: string
  completedAt?: string
}

export interface Payment {
  id: ID
  reference: string
  orderId: ID
  /** Payment amount in INR (whole rupees). */
  amount: number
  status: PaymentStatus
  method: PaymentMethod
  paidAt?: string
  createdAt: string
}

export interface ActivityEvent {
  id: ID
  occurredAt: string
  userId: ID
  action: string
  entityType: 'lead' | 'quotation' | 'deal' | 'order' | 'payment'
  entityId: ID
  entityReference: string
}

export interface AnalyticsDataset {
  departments: Department[]
  serviceCategories: ServiceCategory[]
  users: User[]
  leads: Lead[]
  quotations: Quotation[]
  deals: Deal[]
  orders: Order[]
  payments: Payment[]
  activity: ActivityEvent[]
  /** Monthly revenue target in INR for the target gauge. */
  monthlyRevenueTarget: number
}

export type DatePreset = 'today' | 'last_7' | 'last_30' | 'custom'

export interface DateRange {
  start: Date
  end: Date
  preset: DatePreset
  label: string
}

export interface GlobalFilters {
  dateRange: DateRange
  ownerId: ID | 'all'
  departmentId: ID | 'all'
  serviceCategoryId: ID | 'all'
}

export type DrillEntity =
  | { type: 'lead'; id: ID }
  | { type: 'quotation'; id: ID }
  | { type: 'deal'; id: ID }
  | { type: 'order'; id: ID }
  | { type: 'payment'; id: ID }
  | null
