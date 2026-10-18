-- Business Performance & Revenue Analytics
-- Versioned PostgreSQL schema for Supabase
-- Monetary amounts stored as INTEGER INR (whole rupees).
-- Timestamps stored as timestamptz (UTC).

create extension if not exists "pgcrypto";

create table if not exists departments (
  id text primary key,
  name text not null unique
);

create table if not exists service_categories (
  id text primary key,
  name text not null unique,
  department_id text references departments (id)
);

create table if not exists users (
  id text primary key,
  name text not null,
  role text not null check (role in ('sales', 'operations', 'admin')),
  department_id text references departments (id)
);

create table if not exists leads (
  id text primary key,
  name text not null,
  company text,
  email text,
  phone text,
  source text not null,
  status text not null check (
    status in ('new', 'contacted', 'qualified', 'converted', 'unqualified')
  ),
  owner_id text not null references users (id),
  department_id text references departments (id),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  converted_at timestamptz,
  qualified_at timestamptz,
  unqualified_at timestamptz
);

create table if not exists quotations (
  id text primary key,
  reference text not null unique,
  lead_id text not null references leads (id),
  service_category_id text not null references service_categories (id),
  owner_id text not null references users (id),
  status text not null check (
    status in ('draft', 'sent', 'accepted', 'pending', 'rejected', 'expired')
  ),
  amount integer not null check (amount >= 0),
  created_at timestamptz not null,
  valid_until timestamptz,
  accepted_at timestamptz,
  deal_id text
);

create table if not exists deals (
  id text primary key,
  reference text not null unique,
  lead_id text not null references leads (id),
  quotation_id text references quotations (id),
  service_category_id text not null references service_categories (id),
  owner_id text not null references users (id),
  priority text not null check (priority in ('high', 'medium', 'low')),
  stage text not null check (
    stage in ('prospecting', 'proposal', 'negotiation', 'won', 'lost')
  ),
  value integer not null check (value >= 0),
  progress_percent integer not null check (progress_percent between 0 and 100),
  created_at timestamptz not null,
  expected_close_at timestamptz,
  closed_at timestamptz
);

alter table quotations
  drop constraint if exists quotations_deal_id_fkey;

alter table quotations
  add constraint quotations_deal_id_fkey
  foreign key (deal_id) references deals (id);

create table if not exists orders (
  id text primary key,
  reference text not null unique,
  deal_id text not null references deals (id),
  owner_id text not null references users (id),
  status text not null check (
    status in ('pending', 'in_progress', 'completed', 'on_hold', 'cancelled')
  ),
  total_amount integer not null check (total_amount >= 0),
  progress_percent integer not null check (progress_percent between 0 and 100),
  created_at timestamptz not null,
  due_at timestamptz,
  completed_at timestamptz
);

create table if not exists payments (
  id text primary key,
  reference text not null unique,
  order_id text not null references orders (id),
  amount integer not null check (amount >= 0),
  status text not null check (
    status in ('pending', 'completed', 'failed', 'refunded')
  ),
  method text not null check (
    method in ('bank_transfer', 'card', 'cash', 'upi', 'other')
  ),
  paid_at timestamptz,
  created_at timestamptz not null
);

create table if not exists activity_events (
  id text primary key,
  occurred_at timestamptz not null,
  user_id text not null references users (id),
  action text not null,
  entity_type text not null check (
    entity_type in ('lead', 'quotation', 'deal', 'order', 'payment')
  ),
  entity_id text not null,
  entity_reference text not null
);

create index if not exists idx_leads_created_at on leads (created_at);
create index if not exists idx_leads_owner_id on leads (owner_id);
create index if not exists idx_leads_status on leads (status);
create index if not exists idx_quotations_created_at on quotations (created_at);
create index if not exists idx_quotations_lead_id on quotations (lead_id);
create index if not exists idx_quotations_service_category_id on quotations (service_category_id);
create index if not exists idx_deals_created_at on deals (created_at);
create index if not exists idx_deals_lead_id on deals (lead_id);
create index if not exists idx_deals_quotation_id on deals (quotation_id);
create index if not exists idx_orders_created_at on orders (created_at);
create index if not exists idx_orders_deal_id on orders (deal_id);
create index if not exists idx_payments_paid_at on payments (paid_at);
create index if not exists idx_payments_order_id on payments (order_id);
create index if not exists idx_activity_occurred_at on activity_events (occurred_at);

alter table departments enable row level security;
alter table service_categories enable row level security;
alter table users enable row level security;
alter table leads enable row level security;
alter table quotations enable row level security;
alter table deals enable row level security;
alter table orders enable row level security;
alter table payments enable row level security;
alter table activity_events enable row level security;

-- Public demo: read-only access for anon key (synthetic data only).
do $$
declare
  t text;
begin
  foreach t in array array[
    'departments',
    'service_categories',
    'users',
    'leads',
    'quotations',
    'deals',
    'orders',
    'payments',
    'activity_events'
  ]
  loop
    execute format(
      'drop policy if exists %I on %I',
      t || '_select_anon',
      t
    );
    execute format(
      'create policy %I on %I for select to anon using (true)',
      t || '_select_anon',
      t
    );
  end loop;
end $$;
