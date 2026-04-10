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

## Correct behavior

- Page loads in <3s, auto-refreshes every 60s
- Morning Briefing shows 0 items + green "All systems operational" when healthy
- Morning Briefing surfaces up to 7 items ranked: critical (red) > warning (amber) > info (blue)
- API quota gauges show green (>50%), amber (20-50%), red (<20%) based on remaining capacity
- Cron gaps only appear when a scraper misses 1.5x its expected interval
- All data comes from a single edge function call (`admin-health`)

## Edge cases

- **No API quota data yet**: ApiQuotaGauges section hidden until backend RPC returns the fields
- **No platform_id_daily data**: PlatformCoverageTrend hidden
- **No scraper_run_history**: CronGapDetection hidden
- **All scrapers healthy**: Morning Briefing renders single green banner
- **Auth failure**: Full-page error with HTTP status

## Route

`/label/admin/health` — admin-only (checks `user_profiles.label_role = 'admin'`)
