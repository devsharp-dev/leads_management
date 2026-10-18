import type {
  Department,
  ServiceCategory,
  User,
} from '../../types/domain'

export const departments: Department[] = [
  { id: 'dept-sales', name: 'Sales' },
  { id: 'dept-ops', name: 'Operations' },
  { id: 'dept-compliance', name: 'Compliance' },
  { id: 'dept-branding', name: 'Branding' },
]

export const serviceCategories: ServiceCategory[] = [
  { id: 'svc-pvt', name: 'Private Limited', departmentId: 'dept-compliance' },
  { id: 'svc-llp', name: 'LLP', departmentId: 'dept-compliance' },
  { id: 'svc-tm', name: 'Trademark', departmentId: 'dept-branding' },
  { id: 'svc-startup', name: 'Startup India', departmentId: 'dept-compliance' },
  { id: 'svc-iso', name: 'ISO', departmentId: 'dept-compliance' },
  { id: 'svc-penalty', name: 'Penalty', departmentId: 'dept-ops' },
  { id: 'svc-general', name: 'General Filing', departmentId: 'dept-ops' },
  { id: 'svc-gst', name: 'GST Registration', departmentId: 'dept-compliance' },
]

export const users: User[] = [
  { id: 'user-nancy', name: 'Nancy Singh', role: 'sales', departmentId: 'dept-sales' },
  { id: 'user-sneha', name: 'Sneha Choudhary', role: 'sales', departmentId: 'dept-sales' },
  { id: 'user-tannu', name: 'Tannu', role: 'sales', departmentId: 'dept-sales' },
  { id: 'user-rahul', name: 'Rahul Mehta', role: 'sales', departmentId: 'dept-sales' },
  { id: 'user-priya', name: 'Priya Sharma', role: 'sales', departmentId: 'dept-sales' },
  { id: 'user-gaurav', name: 'Gaurav Pant', role: 'operations', departmentId: 'dept-ops' },
  { id: 'user-srishti', name: 'Srishti Upadhyay', role: 'operations', departmentId: 'dept-ops' },
  { id: 'user-azam', name: 'Azam Afroz', role: 'operations', departmentId: 'dept-ops' },
  { id: 'user-admin', name: 'Admin User', role: 'admin', departmentId: 'dept-sales' },
]

export const leadSources = [
  'Google Ads',
  'Website',
  'Just Dial',
  'Referral',
  'LinkedIn',
  'Other',
] as const
