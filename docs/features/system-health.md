# System Health — Ops Dashboard

One-page morning check for a solo engineer running 25+ scrapers across 6 machines.

## Who uses it

Paul (admin) — opens this page every morning to check if anything is broken.

## What it does

Shows operational health in priority order:

1. **Morning Briefing** — severity-ranked alert cards (errors, overdue scrapers, stale data, low API credits, unresolved entities)
2. **Concurrent Scrapers** — how many scrapers are running right now
3. **API Quota Gauges** — ScrapeCreators credits remaining + burn rate + projected exhaustion; YouTube Data API daily usage
4. **Data Freshness** — per-platform staleness (fresh <8h, stale 8-26h, critical >26h)
5. **Scraper Status** — grouped by schedule (4x_daily, daily, free_apis, dbt) with expandable run history
6. **Cron Gap Detection** — highlights scrapers where gap between runs exceeds 2x expected interval
7. **Data Totals** — row counts with daily pace bars
8. **Platform Coverage Trend** — sparklines showing wb_platform_ids per platform over 7 days
9. **Content Pipeline** — HITL pipeline status (TikTok + Reels)
10. **Coverage Analysis** — geo, multi-platform, song coverage percentages
11. **Unresolved Entities** — artists with 0 platform_ids (identity resolution failures)
12. **Platform Breakdown** — per-platform observation/entity/country counts
13. **dbt Health, Top Entities, Data Quality** — collapsible informational sections

## Sub-pages

Each sub-page fetches its own data independently. All pages share the sidebar navigation.

- **Overview** — Morning briefing + scraper status (uses shared `admin-health` edge function)
- **Live Activity** — Real-time scraper run feed (30s refresh from `scraper_runs`)
- **Scrapers** — Grouped scraper status with expandable run history
- **Error Trends** — Daily error chart + per-scraper error breakdown (60s refresh)
- **Performance** — Scraper duration/throughput trends (60s refresh)
- **Cron Jobs** — Gap detection for missed schedules
- **Inventory** — Script inventory and coverage
- **Servers** — Machine-level scraper grouping
- **n8n Workflows** — Workflow status from n8n API (30s refresh)
- **Pipeline** — HITL pipeline status
- **API Quotas** — ScrapeCreators + YouTube quota gauges
- **Database** — Table sizes and row counts from `db-sizes` edge function (5min refresh)
- **Data** — Data totals, freshness, accumulation
- **Identity** — Platform ID coverage per artist
- **Handle Health** — Dead/stale/changed platform handles

## Correct behavior

- Page loads in <3s, auto-refreshes every 60s (overview); sub-pages have independent intervals
- Morning Briefing shows 0 items + green "All systems operational" when healthy
- Morning Briefing surfaces up to 7 items ranked: critical (red) > warning (amber) > info (blue)
- API quota gauges show green (>50%), amber (20-50%), red (<20%) based on remaining capacity
- Cron gaps only appear when a scraper misses 1.5x its expected interval
- Overview data comes from a single edge function call (`admin-health`)
- Loading states show animated skeleton placeholders (not plain text)
- Sub-page crashes show inline error with "Try Again" + "Copy" button; sidebar remains usable

## Edge cases

- **No API quota data yet**: ApiQuotaGauges section hidden until backend RPC returns the fields
- **No platform_id_daily data**: PlatformCoverageTrend hidden
- **No scraper_run_history**: CronGapDetection hidden
- **All scrapers healthy**: Morning Briefing renders single green banner
- **Auth failure**: Full-page error with HTTP status
- **Sub-page crash**: Local ErrorBoundary catches the error, displays dark-themed fallback within the layout — sidebar stays visible for navigation
- **Null table names from db-sizes**: Filtered server-side and client-side; `getCategory()` guards against undefined

## Route

`/label/admin/health` — admin-only (checks `user_profiles.label_role = 'admin'`)
