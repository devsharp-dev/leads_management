# Business Performance & Revenue Analytics Dashboard

Admin analytics dashboard for the lead → quotation → deal → order → payment lifecycle. Built for the Internshala / leads-management assignment with deterministic seed data, global date filters, previous-period comparisons, and relationship drill-downs.

## Stack

- React 19 + Vite + TypeScript
- Tailwind CSS v4
- Recharts, Lucide React, date-fns, Zod
- Supabase JS client (optional live PostgreSQL)
- Vitest + ESLint

No Next.js and no Express/Node API. The UI talks either to:

1. **Mock repository** (default) — deterministic TypeScript seed in `src/data/seed/`
2. **Supabase** — when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

## Quick start (local)

```bash
cd business-analytics-dashboard
npm install
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`).

Without Supabase env vars the banner notes that the **mock repository** is in use. This is intentional and fully functional for the assignment.

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Serve `dist/` |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npm run seed:sql` | Regenerate `supabase/seed.sql` from the TS seed |

## Environment variables

Copy `.env.example` to `.env.local` (never commit secrets):

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | No | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | No | Supabase anon/public key (not service role) |

If either is missing, the app stays on the mock repository and does **not** claim a live database connection.

## Supabase setup (optional)

1. Create a free Supabase project.
2. In the SQL editor, run `supabase/schema.sql`.
3. Run `supabase/seed.sql` (or regenerate with `npm run seed:sql` then run it).
4. Enable the anon read policies already defined in the schema (synthetic demo data only).
5. Put the project URL and **anon** key in `.env.local`.
6. Restart `npm run dev` and confirm the banner shows `Data source: supabase`.

RLS is enabled with read-only `anon` select policies for demo tables. Do not put real customer data in this project.

## Architecture

```
src/
  components/     # layout, charts, tables, drill-down drawer
  features/       # pure metrics + filter context (single source of truth)
  data/           # mock repository + optional Supabase loader
  lib/            # dates, currency, CSV export, seed validation
  types/          # domain model
supabase/
  schema.sql      # tables, FKs, indexes, RLS
  seed.sql        # deterministic relational seed
```

Metric definitions live in pure functions under `src/features/*/…-metrics.ts` so KPIs, charts, and tables share one calculation path. Global filters (date preset/custom, owner, department) live in `FilterContext` and recompute the whole dashboard together.

## Date semantics

- **Today / Last 7 / Last 30 / Custom** — inclusive calendar days
- Previous period = immediately preceding window of the same length
- Zero previous values show `New` or `---` (never Infinity/NaN)
- Conversion rate comparisons use percentage points

Default dashboard clock is anchored to the seed date **2026-10-18** so Last 30 Days lines up with the fixture window.

## Deploy to Vercel

No live deployment URL is attached from this environment (no GitHub remote / Vercel project linked). Remaining steps:

1. Create a GitHub repository and push this app (root = `business-analytics-dashboard`).
2. Import the repo in [Vercel](https://vercel.com).
3. Framework preset: Vite. Build command: `npm run build`. Output: `dist`.
4. Optionally add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel env settings.
5. Deploy a preview, smoke-test filters, charts, drill-downs, and CSV export, then promote.

Do not set a service-role key in the browser build.

## Validation

Commands run successfully in development:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Limitations

- No authentication / RBAC
- Live Supabase is optional; without credentials the mock path is used
- Revenue target gauge uses collected payments vs a fixed monthly target constant
- Lead “funnel” is labeled as status distribution for leads created in range
- CSV export covers summary KPI rows (not every table)

## License

Assignment / educational use.
