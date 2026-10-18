/**
 * Generates supabase/seed.sql from the deterministic TypeScript seed dataset.
 * Run: node --experimental-strip-types scripts/generate-seed-sql.mjs
 * (or: npx tsx scripts/generate-seed-sql.ts — see sibling .ts if present)
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// Dynamic import of compiled-less TS via vitest/vite is awkward; inline a minimal
// generator by spawning tsx if available.
async function main() {
  const { execSync } = await import('node:child_process')
  const out = execSync(
    'npx --yes tsx -e "import { seedDataset } from \'./src/data/seed/dataset.ts\'; console.log(JSON.stringify(seedDataset))"',
    { cwd: root, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 },
  )
  const data = JSON.parse(out)
  const esc = (v) => {
    if (v == null) return 'NULL'
    if (typeof v === 'number') return String(v)
    return `'${String(v).replace(/'/g, "''")}'`
  }

  const lines = [
    '-- Deterministic seed generated from src/data/seed/dataset.ts',
    '-- Re-run: npm run seed:sql',
    'begin;',
    'truncate activity_events, payments, orders, deals, quotations, leads, users, service_categories, departments cascade;',
  ]

  for (const d of data.departments) {
    lines.push(`insert into departments (id, name) values (${esc(d.id)}, ${esc(d.name)});`)
  }
  for (const c of data.serviceCategories) {
    lines.push(
      `insert into service_categories (id, name, department_id) values (${esc(c.id)}, ${esc(c.name)}, ${esc(c.departmentId)});`,
    )
  }
  for (const u of data.users) {
    lines.push(
      `insert into users (id, name, role, department_id) values (${esc(u.id)}, ${esc(u.name)}, ${esc(u.role)}, ${esc(u.departmentId)});`,
    )
  }
  for (const l of data.leads) {
    lines.push(
      `insert into leads (id, name, company, email, phone, source, status, owner_id, department_id, created_at, updated_at, converted_at, qualified_at, unqualified_at) values (${esc(l.id)}, ${esc(l.name)}, ${esc(l.company)}, ${esc(l.email)}, ${esc(l.phone)}, ${esc(l.source)}, ${esc(l.status)}, ${esc(l.ownerId)}, ${esc(l.departmentId)}, ${esc(l.createdAt)}, ${esc(l.updatedAt)}, ${esc(l.convertedAt)}, ${esc(l.qualifiedAt)}, ${esc(l.unqualifiedAt)});`,
    )
  }
  // quotations without deal_id first, then deals, then update deal_id
  for (const q of data.quotations) {
    lines.push(
      `insert into quotations (id, reference, lead_id, service_category_id, owner_id, status, amount, created_at, valid_until, accepted_at, deal_id) values (${esc(q.id)}, ${esc(q.reference)}, ${esc(q.leadId)}, ${esc(q.serviceCategoryId)}, ${esc(q.ownerId)}, ${esc(q.status)}, ${esc(q.amount)}, ${esc(q.createdAt)}, ${esc(q.validUntil)}, ${esc(q.acceptedAt)}, NULL);`,
    )
  }
  for (const d of data.deals) {
    lines.push(
      `insert into deals (id, reference, lead_id, quotation_id, service_category_id, owner_id, priority, stage, value, progress_percent, created_at, expected_close_at, closed_at) values (${esc(d.id)}, ${esc(d.reference)}, ${esc(d.leadId)}, ${esc(d.quotationId)}, ${esc(d.serviceCategoryId)}, ${esc(d.ownerId)}, ${esc(d.priority)}, ${esc(d.stage)}, ${esc(d.value)}, ${esc(d.progressPercent)}, ${esc(d.createdAt)}, ${esc(d.expectedCloseAt)}, ${esc(d.closedAt)});`,
    )
  }
  for (const q of data.quotations) {
    if (q.dealId) {
      lines.push(`update quotations set deal_id = ${esc(q.dealId)} where id = ${esc(q.id)};`)
    }
  }
  for (const o of data.orders) {
    lines.push(
      `insert into orders (id, reference, deal_id, owner_id, status, total_amount, progress_percent, created_at, due_at, completed_at) values (${esc(o.id)}, ${esc(o.reference)}, ${esc(o.dealId)}, ${esc(o.ownerId)}, ${esc(o.status)}, ${esc(o.totalAmount)}, ${esc(o.progressPercent)}, ${esc(o.createdAt)}, ${esc(o.dueAt)}, ${esc(o.completedAt)});`,
    )
  }
  for (const p of data.payments) {
    lines.push(
      `insert into payments (id, reference, order_id, amount, status, method, paid_at, created_at) values (${esc(p.id)}, ${esc(p.reference)}, ${esc(p.orderId)}, ${esc(p.amount)}, ${esc(p.status)}, ${esc(p.method)}, ${esc(p.paidAt)}, ${esc(p.createdAt)});`,
    )
  }
  for (const a of data.activity) {
    lines.push(
      `insert into activity_events (id, occurred_at, user_id, action, entity_type, entity_id, entity_reference) values (${esc(a.id)}, ${esc(a.occurredAt)}, ${esc(a.userId)}, ${esc(a.action)}, ${esc(a.entityType)}, ${esc(a.entityId)}, ${esc(a.entityReference)});`,
    )
  }
  lines.push('commit;')

  const target = join(root, 'supabase', 'seed.sql')
  writeFileSync(target, `${lines.join('\n')}\n`)
  console.log(`Wrote ${target} (${lines.length} statements)`)
  void createRequire
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
