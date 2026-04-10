# Session: Ops Dashboard Full Transparency Buildout — 2026-04-08

## What changed

### Bug fix: Kworb scrapers showing "Never run"

- **Root cause:** `get_latest_scraper_runs` RPC doesn't exist. Fallback query used `LIMIT 200`, but high-frequency scrapers (carl/oscar every 2min) consumed all 200 slots. Kworb scrapers (4x daily) never appeared.
- **Fix:** Bumped fallback limit from 200 to 5000 in `edge-functions/admin-health.ts`
- **Deployed:** admin-health v13 (also includes dbt model row counts)

### New pages (4 pages, 1 component)

**`src/pages/label/health/HealthActivity.tsx`** — Live Activity Feed

- Real-time chronological stream of scraper events
- Queries `scraper_runs` directly (last 200 rows), auto-refresh 30s
- Status filter buttons (success/running/errors), expandable error messages
- Route: `/label/admin/health/activity`

**`src/pages/label/health/HealthErrors.tsx`** — Error Trends

- 7-day error chart (daily bars) + errors-by-scraper horizontal bar chart
- Full error detail list with expandable messages
- Summary stats: total errors, affected scrapers, today's count
- Route: `/label/admin/health/errors`

**`src/pages/label/health/HealthPerformance.tsx`** — Scraper Performance

- Per-scraper table: runs, avg/min/max duration, avg rows, error %, trend direction
- Trend detection: compares first-half vs second-half duration averages (>15% = slower/faster)
- Click any scraper to see a duration-over-time line chart
- Sortable by duration, throughput, errors, or run count
- Route: `/label/admin/health/performance`

**`src/pages/label/health/HealthHandles.tsx`** — Handle Health Audit

- Surfaces `handle_health` data from admin-health (was fetched but never displayed)
- Summary stats: total handles, alive/dead/stale/changed/never-checked/stale>7d
- Per-platform status bars with color-coded segments
- Recent deaths list (artist name, platform, handle, failure count, time)
- Recent handle changes (old handle strikethrough -> new handle, green)
- Route: `/label/admin/health/handles`

**`src/components/admin/pipeline/PipelineCostTrend.tsx`** — 7-day Cost Trend

- Stacked area chart: Gemini calls, Apify calls, Storage uploads
- Extracts daily costs from `pipeline_health_stats` RPC throughput_7d
- 7-day totals in header, tooltip with per-day breakdown + estimated USD
- Added to Pipeline page below PipelineSection

### Phase 2: n8n + Database + Sidebar (same session)

**`edge-functions/n8n-status.ts`** — n8n Workflow Status endpoint (deployed)

- Calls n8n REST API (`GET /api/v1/workflows`, `GET /api/v1/executions`)
- Uses `N8N_API_KEY` secret (set via CLI), admin-only auth
- Returns workflow list, recent executions, 24h stats

**`edge-functions/db-sizes.ts`** — Database Table Sizes endpoint (deployed)

- Calls `get_table_sizes()` RPC for full byte-level data
- Falls back to `pg_stat_user_tables` for row counts if RPC doesn't exist yet
- Admin-only auth

**`src/pages/label/health/HealthN8n.tsx`** — n8n Workflows page

- Summary stats (total/active workflows, 24h executions/errors/running)
- Two views: Recent Executions (chronological stream) and All Workflows (table)
- Route: `/label/admin/health/n8n`

**`src/pages/label/health/HealthDatabase.tsx`** — Database page

- Table list with row counts, byte sizes (when RPC exists), category grouping
- Row bar visualization, sortable by size/rows/name, filterable by category
- Route: `/label/admin/health/database`

### Sidebar reorganization

**`src/pages/label/health/HealthSidebar.tsx`** — Fully rewritten

- 15 items organized into 4 groups: (top-level), Monitoring, Infrastructure, Data Quality
- Group labels with subtle accent color when active group
- Compact 7px padding per item (was 8px) to fit everything

### Supporting changes

- `src/components/admin/health/types.ts` — Added `HandleHealthData` + related interfaces, `handle_health` field on `HealthData`
- `src/components/admin/pipeline/PipelineCostTrend.tsx` — New 7-day cost trend chart
- `src/pages/label/health/HealthPipeline.tsx` — Added PipelineCostTrend
- `src/App.tsx` — 6 new lazy imports + routes (Activity, Errors, Performance, Handles, N8n, Database)
- `docs/handoffs/backend-todo.md` — Added `get_latest_scraper_runs` RPC task
- `docs/handoffs/backend-health-dashboard.md` — Full backend investigation handoff
- Supabase secrets: set `N8N_API_KEY` and `N8N_HOST`

## Why

Paul wanted the Admin Health Panel to be a transparent peek into the backend "black box." The existing pages covered scraper status and data totals, but missed real-time activity, error patterns, performance degradation, handle validity, cost trends, n8n workflow visibility, and database storage.

## What was tested

- `npx tsc --noEmit` — clean
- `npm run build` — clean (8.6s)
- Verified `scraper_runs` table returns data via anon key (Activity, Errors, Performance pages work)
- Verified `handle_health` field returned by admin-health endpoint
- Edge functions deployed: `n8n-status`, `db-sizes`, `admin-health` (v13)
- Supabase secrets set: `N8N_API_KEY`, `N8N_HOST`

## What to verify in browser

- **Sidebar** — Should show 4 groups (top-level, Monitoring, Infrastructure, Data Quality) with 15 total items
- **Live Activity** — Real-time scraper event stream with auto-refresh 30s
- **Error Trends** — 7-day daily bar chart + by-scraper chart + error list
- **Performance** — Per-scraper table with duration/trend data, click for detail chart
- **Handle Health** — Platform status bars, dead handles, handle changes (needs `get_handle_health_stats` RPC)
- **n8n Workflows** — Workflow list + recent executions (may fail if Hetzner firewall blocks Supabase → port 5678)
- **Database** — Table list with row counts (byte sizes need `get_table_sizes` RPC)
- **Pipeline** — Should now have 7-day cost trend chart below PipelineSection
